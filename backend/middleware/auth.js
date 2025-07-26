const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token, access denied' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7, authHeader.length) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'No token, access denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid - user not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({ message: 'Account is temporarily locked' });
      }

      // Add user info to request object
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        permissions: decoded.permissions || user.permissions,
        username: user.username,
        fullName: user.fullName
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token is not valid' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}` 
      });
    }

    next();
  };
};

// Multiple permissions check (user must have ALL permissions)
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasAllPermissions = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}` 
      });
    }

    next();
  };
};

// Multiple permissions check (user must have ANY of the permissions)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasAnyPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: `Access denied. Required one of: ${requiredPermissions.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = requireRole('Admin');

// Analyst or Admin middleware
const analystOrAdmin = requireRole(['Analyst', 'Admin']);

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  adminOnly,
  analystOrAdmin
};
