const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('redis');

// Redis client for distributed rate limiting (optional)
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisClient = null; // Fall back to memory-based rate limiting
    });
  }
} catch (error) {
  console.warn('Redis not available, using memory-based rate limiting');
  redisClient = null;
}

// Different rate limits for different endpoints
const rateLimitConfigs = {
  // General API requests
  general: {
    keyGenerator: (req) => req.ip,
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Number of requests
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // Per 15 minutes (900 seconds)
    blockDuration: 900, // Block for 15 minutes if limit exceeded
  },

  // Authentication endpoints (more restrictive)
  auth: {
    keyGenerator: (req) => req.ip,
    points: 5, // 5 login attempts
    duration: 900, // Per 15 minutes
    blockDuration: 1800, // Block for 30 minutes
  },

  // Search endpoints (moderate)
  search: {
    keyGenerator: (req) => req.user ? `${req.user.userId}:${req.ip}` : req.ip,
    points: 50, // 50 searches
    duration: 60, // Per minute
    blockDuration: 300, // Block for 5 minutes
  },

  // Upload endpoints (very restrictive)
  upload: {
    keyGenerator: (req) => req.user ? `${req.user.userId}:${req.ip}` : req.ip,
    points: 3, // 3 uploads
    duration: 3600, // Per hour
    blockDuration: 3600, // Block for 1 hour
  },

  // Data modification endpoints
  modify: {
    keyGenerator: (req) => req.user ? `${req.user.userId}:${req.ip}` : req.ip,
    points: 30, // 30 modifications
    duration: 300, // Per 5 minutes
    blockDuration: 600, // Block for 10 minutes
  }
};

// Create rate limiters
const createRateLimiter = (config) => {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      ...config
    });
  } else {
    return new RateLimiterMemory(config);
  }
};

// Initialize rate limiters
const rateLimiters = {
  general: createRateLimiter(rateLimitConfigs.general),
  auth: createRateLimiter(rateLimitConfigs.auth),
  search: createRateLimiter(rateLimitConfigs.search),
  upload: createRateLimiter(rateLimitConfigs.upload),
  modify: createRateLimiter(rateLimitConfigs.modify)
};

// Generic rate limiter middleware
const createRateLimitMiddleware = (limiterType = 'general') => {
  return async (req, res, next) => {
    const limiter = rateLimiters[limiterType];
    const config = rateLimitConfigs[limiterType];
    
    if (!limiter) {
      console.warn(`Rate limiter type '${limiterType}' not found, using general`);
      return rateLimiters.general;
    }

    try {
      const key = config.keyGenerator(req);
      const result = await limiter.consume(key);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.points,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext)
      });

      next();
    } catch (rejRes) {
      // Rate limit exceeded
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': config.points,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext),
        'Retry-After': secs
      });

      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${config.keyGenerator(req)} on ${limiterType} endpoint`);

      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
};

// Specific middleware functions
const generalRateLimit = createRateLimitMiddleware('general');
const authRateLimit = createRateLimitMiddleware('auth');
const searchRateLimit = createRateLimitMiddleware('search');
const uploadRateLimit = createRateLimitMiddleware('upload');
const modifyRateLimit = createRateLimitMiddleware('modify');

// Progressive rate limiting based on user role
const roleBasedRateLimit = async (req, res, next) => {
  let multiplier = 1;
  
  // Give higher limits to higher roles
  if (req.user) {
    switch (req.user.role) {
      case 'Admin':
        multiplier = 3;
        break;
      case 'Analyst':
        multiplier = 2;
        break;
      case 'Viewer':
      default:
        multiplier = 1;
        break;
    }
  }

  // Create dynamic rate limiter with role-based limits
  const dynamicLimiter = redisClient 
    ? new RateLimiterRedis({
        storeClient: redisClient,
        keyGenerator: (req) => req.user ? `${req.user.userId}:${req.ip}` : req.ip,
        points: Math.floor(rateLimitConfigs.general.points * multiplier),
        duration: rateLimitConfigs.general.duration,
        blockDuration: rateLimitConfigs.general.blockDuration
      })
    : new RateLimiterMemory({
        keyGenerator: (req) => req.user ? `${req.user.userId}:${req.ip}` : req.ip,
        points: Math.floor(rateLimitConfigs.general.points * multiplier),
        duration: rateLimitConfigs.general.duration,
        blockDuration: rateLimitConfigs.general.blockDuration
      });

  try {
    const key = req.user ? `${req.user.userId}:${req.ip}` : req.ip;
    const result = await dynamicLimiter.consume(key);
    
    res.set({
      'X-RateLimit-Limit': Math.floor(rateLimitConfigs.general.points * multiplier),
      'X-RateLimit-Remaining': result.remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext)
    });

    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    res.set({
      'X-RateLimit-Limit': Math.floor(rateLimitConfigs.general.points * multiplier),
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext),
      'Retry-After': secs
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${secs} seconds.`,
      retryAfter: secs
    });
  }
};

// Skip rate limiting for development
const skipRateLimitInDev = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
      return next();
    }
    return middleware(req, res, next);
  };
};

module.exports = {
  // Default export (general rate limiting)
  rateLimiter: skipRateLimitInDev(generalRateLimit),
  
  // Specific rate limiters
  generalRateLimit: skipRateLimitInDev(generalRateLimit),
  authRateLimit: skipRateLimitInDev(authRateLimit),
  searchRateLimit: skipRateLimitInDev(searchRateLimit),
  uploadRateLimit: skipRateLimitInDev(uploadRateLimit),
  modifyRateLimit: skipRateLimitInDev(modifyRateLimit),
  roleBasedRateLimit: skipRateLimitInDev(roleBasedRateLimit),
  
  // Custom rate limiter creator
  createRateLimitMiddleware: (type) => skipRateLimitInDev(createRateLimitMiddleware(type))
};
