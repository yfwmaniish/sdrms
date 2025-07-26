const winston = require('winston');

// Configure logger for error handling
const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'duplicate value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again!', 401);

// Send error response in development
const sendErrorDev = (err, req, res) => {
  // Log error
  errorLogger.error('Development Error:', {
    error: err,
    request: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  return res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // Log error
  errorLogger.error('Production Error:', {
    message: err.message,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    request: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    stack: err.stack
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// Async error wrapper for route handlers
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
const handleUnhandledRoutes = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  errorLogger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  errorLogger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  
  // Give server time to finish pending requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  return (err) => {
    errorLogger.info(`${signal} received. Shutting down gracefully...`);
    console.log(`${signal} received. Shutting down gracefully...`);
    
    // Close server and database connections
    if (global.server) {
      global.server.close(() => {
        console.log('💥 Process terminated!');
        process.exit(err ? 1 : 0);
      });
    } else {
      process.exit(err ? 1 : 0);
    }
  };
};

process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

module.exports = {
  errorHandler,
  AppError,
  catchAsync,
  handleUnhandledRoutes,
  errorLogger
};
