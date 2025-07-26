const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Analyst', 'Viewer'],
    default: 'Viewer'
  },
  permissions: [{
    type: String,
    enum: [
      'read_subscribers',
      'write_subscribers',
      'delete_subscribers',
      'upload_data',
      'manage_users',
      'view_analytics',
      'flag_suspicious',
      'export_data'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  profile: {
    avatar: String,
    phone: String,
    address: String,
    emergencyContact: String
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  auditLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes (removed duplicates since they're already defined in schema fields)

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    switch (this.role) {
      case 'Admin':
        this.permissions = [
          'read_subscribers',
          'write_subscribers',
          'delete_subscribers',
          'upload_data',
          'manage_users',
          'view_analytics',
          'flag_suspicious',
          'export_data'
        ];
        break;
      case 'Analyst':
        this.permissions = [
          'read_subscribers',
          'write_subscribers',
          'upload_data',
          'view_analytics',
          'flag_suspicious',
          'export_data'
        ];
        break;
      case 'Viewer':
        this.permissions = [
          'read_subscribers',
          'view_analytics'
        ];
        break;
      default:
        this.permissions = ['read_subscribers'];
    }
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.addAuditLog = function(action, details = {}) {
  this.auditLog.push({
    action,
    details,
    timestamp: new Date()
  });
  return this.save();
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.canAccess = function(resource) {
  const resourcePermissions = {
    'subscribers': ['read_subscribers'],
    'upload': ['upload_data'],
    'analytics': ['view_analytics'],
    'users': ['manage_users'],
    'export': ['export_data']
  };
  
  const requiredPerms = resourcePermissions[resource] || [];
  return requiredPerms.some(perm => this.hasPermission(perm));
};

// Static methods
userSchema.statics.findByLogin = function(login) {
  return this.findOne({
    $or: [
      { email: login },
      { username: login }
    ]
  });
};

userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true }).select('-password');
};

userSchema.statics.getUsersByRole = function(role) {
  return this.find({ role, isActive: true }).select('-password');
};

// Transform output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model('User', userSchema);
