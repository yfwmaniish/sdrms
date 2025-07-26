const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  // Personal Information
  subscriberName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  
  // Contact Information
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid mobile number format'
    }
  },
  alternateNumber: {
    type: String,
    trim: true
  },
  emailId: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Address Information
  address: {
    street: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    district: { type: String, trim: true, index: true },
    state: { type: String, trim: true, default: 'Haryana' },
    pincode: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\d{6}$/.test(v);
        },
        message: 'Invalid pincode format'
      }
    }
  },
  
  // Identity Documents
  identityDocuments: [{
    docType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Voter ID', 'Driving License', 'Passport'],
      required: true
    },
    docNumber: {
      type: String,
      required: true,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // SIM/Connection Details
  simDetails: {
    simId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    imsi: {
      type: String,
      trim: true
    },
    iccid: {
      type: String,
      trim: true
    },
    connectionType: {
      type: String,
      enum: ['Prepaid', 'Postpaid'],
      default: 'Prepaid'
    },
    activationDate: {
      type: Date,
      default: Date.now
    },
    lastRechargeDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Terminated'],
      default: 'Active'
    }
  },
  
  // Device Information
  deviceInfo: {
    imei: {
      type: String,
      trim: true,
      index: true
    },
    deviceModel: {
      type: String,
      trim: true
    },
    deviceBrand: {
      type: String,
      trim: true
    }
  },
  
  // Operator Information
  operatorDetails: {
    operatorName: {
      type: String,
      required: true,
      trim: true
    },
    circle: {
      type: String,
      default: 'Haryana'
    },
    serviceProvider: {
      type: String,
      trim: true
    }
  },
  
  // Data Source Information
  dataSource: {
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload'
    },
    fileName: {
      type: String,
      trim: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    sourceFormat: {
      type: String,
      enum: ['CSV', 'XLSX', 'TXT', 'MDB']
    }
  },
  
  // Fraud Detection Fields
  fraudFlags: {
    isSuspicious: {
      type: Boolean,
      default: false
    },
    suspiciousReasons: [{
      type: String,
      enum: ['Duplicate Identity', 'Invalid Documents', 'Frequent SIM Swaps', 'Unusual Activity']
    }],
    flaggedDate: {
      type: Date
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Audit Trail
  auditLog: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Metadata
  metadata: {
    tags: [String],
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  }
}, {
  timestamps: true,
  collection: 'subscribers'
});

// Indexes for better performance
subscriberSchema.index({ 'subscriberName': 'text', 'address.city': 'text', 'address.district': 'text' });
subscriberSchema.index({ 'simDetails.simId': 1 });
subscriberSchema.index({ 'deviceInfo.imei': 1 });
subscriberSchema.index({ 'fraudFlags.isSuspicious': 1 });
subscriberSchema.index({ 'dataSource.uploadDate': -1 });
subscriberSchema.index({ createdAt: -1 });

// Virtual for full name
subscriberSchema.virtual('fullName').get(function() {
  return this.fatherName ? `${this.subscriberName} S/O ${this.fatherName}` : this.subscriberName;
});

// Virtual for full address
subscriberSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return [addr.street, addr.landmark, addr.city, addr.district, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');
});

// Pre-save middleware
subscriberSchema.pre('save', function(next) {
  // Add audit log entry for new records
  if (this.isNew) {
    this.auditLog.push({
      action: 'CREATE',
      timestamp: new Date()
    });
  }
  next();
});

// Methods
subscriberSchema.methods.flagAsSuspicious = function(reason, userId) {
  this.fraudFlags.isSuspicious = true;
  this.fraudFlags.suspiciousReasons.push(reason);
  this.fraudFlags.flaggedDate = new Date();
  this.fraudFlags.flaggedBy = userId;
  
  this.auditLog.push({
    action: 'FLAG_SUSPICIOUS',
    performedBy: userId,
    changes: { reason }
  });
  
  return this.save();
};

subscriberSchema.methods.updateStatus = function(status, userId) {
  const oldStatus = this.simDetails.status;
  this.simDetails.status = status;
  
  this.auditLog.push({
    action: 'STATUS_UPDATE',
    performedBy: userId,
    changes: { from: oldStatus, to: status }
  });
  
  return this.save();
};

// Static methods
subscriberSchema.statics.findByMobile = function(mobileNumber) {
  return this.findOne({ mobileNumber });
};

subscriberSchema.statics.findSuspicious = function() {
  return this.find({ 'fraudFlags.isSuspicious': true });
};

subscriberSchema.statics.searchByText = function(query, options = {}) {
  const searchQuery = {
    $or: [
      { subscriberName: { $regex: query, $options: 'i' } },
      { mobileNumber: { $regex: query, $options: 'i' } },
      { 'address.city': { $regex: query, $options: 'i' } },
      { 'address.district': { $regex: query, $options: 'i' } },
      { 'simDetails.simId': { $regex: query, $options: 'i' } },
      { 'deviceInfo.imei': { $regex: query, $options: 'i' } }
    ]
  };
  
  return this.find(searchQuery)
    .limit(options.limit || 50)
    .skip(options.skip || 0)
    .sort(options.sort || { createdAt: -1 });
};

module.exports = mongoose.model('Subscriber', subscriberSchema);
