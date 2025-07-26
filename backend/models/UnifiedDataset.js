const mongoose = require('mongoose');

// Unified dataset schema for standardized telecom subscriber data
const unifiedDatasetSchema = new mongoose.Schema({
  // Core Identifier Fields
  subscriber_id: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Source Information
  source_provider: {
    type: String,
    required: true,
    index: true,
    enum: ['airtel', 'jio', 'bsnl', 'vodafone', 'idea', 'other']
  },
  original_id: {
    type: String,
    required: true
  },
  dataset_version: {
    type: String,
    default: '1.0'
  },
  ingestion_date: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Personal Information
  first_name: {
    type: String,
    required: true,
    index: true
  },
  last_name: {
    type: String,
    required: true,
    index: true
  },
  full_name: {
    type: String,
    index: true
  },
  date_of_birth: {
    type: Date,
    index: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown'],
    default: 'unknown'
  },
  
  // Contact Information
  primary_phone: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  secondary_phone: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    lowercase: true,
    sparse: true,
    index: true
  },
  
  // Address Information
  address: {
    street: String,
    city: {
      type: String,
      index: true
    },
    state: {
      type: String,
      index: true
    },
    postal_code: {
      type: String,
      index: true
    },
    country: {
      type: String,
      default: 'India',
      index: true
    },
    latitude: Number,
    longitude: Number
  },
  
  // Service Information
  service_type: {
    type: String,
    enum: ['prepaid', 'postpaid', 'hybrid'],
    required: true,
    index: true
  },
  plan_name: {
    type: String,
    index: true
  },
  plan_amount: {
    type: Number,
    min: 0
  },
  activation_date: {
    type: Date,
    index: true
  },
  last_recharge_date: {
    type: Date,
    index: true
  },
  account_balance: {
    type: Number,
    default: 0
  },
  
  // Usage Statistics
  monthly_usage: {
    voice_minutes: {
      type: Number,
      default: 0
    },
    sms_count: {
      type: Number,
      default: 0
    },
    data_mb: {
      type: Number,
      default: 0
    }
  },
  
  // KYC and Verification
  kyc_status: {
    type: String,
    enum: ['verified', 'pending', 'rejected', 'not_provided'],
    default: 'not_provided',
    index: true
  },
  identity_type: {
    type: String,
    enum: ['aadhaar', 'pan', 'voter_id', 'passport', 'driving_license', 'other'],
    index: true
  },
  identity_number: {
    type: String,
    sparse: true
  },
  
  // Status and Flags
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
    required: true,
    index: true
  },
  is_fraud_flagged: {
    type: Boolean,
    default: false,
    index: true
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Metadata and Tags
  tags: [{
    type: String,
    index: true
  }],
  notes: String,
  custom_fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Audit Trail
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
unifiedDatasetSchema.index({ primary_phone: 1, source_provider: 1 });
unifiedDatasetSchema.index({ first_name: 1, last_name: 1 });
unifiedDatasetSchema.index({ 'address.city': 1, 'address.state': 1 });
unifiedDatasetSchema.index({ service_type: 1, status: 1 });
unifiedDatasetSchema.index({ activation_date: 1, source_provider: 1 });
unifiedDatasetSchema.index({ ingestion_date: -1 });
unifiedDatasetSchema.index({ risk_score: -1, is_fraud_flagged: 1 });

// Text search index
unifiedDatasetSchema.index({
  full_name: 'text',
  primary_phone: 'text',
  email: 'text',
  'address.city': 'text',
  'address.state': 'text',
  plan_name: 'text',
  notes: 'text'
});

// Pre-save middleware to generate full name and subscriber_id
unifiedDatasetSchema.pre('save', function(next) {
  // Generate full name
  if (this.first_name && this.last_name) {
    this.full_name = `${this.first_name} ${this.last_name}`;
  }
  
  // Generate unique subscriber_id if not provided
  if (!this.subscriber_id) {
    this.subscriber_id = `${this.source_provider.toUpperCase()}_${this.original_id}`;
  }
  
  // Calculate age from date of birth
  if (this.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  
  next();
});

// Pre-insertMany middleware for bulk operations
unifiedDatasetSchema.pre('insertMany', function(next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      // Generate full name
      if (doc.first_name && doc.last_name) {
        doc.full_name = `${doc.first_name} ${doc.last_name}`;
      }
      
      // Generate unique subscriber_id if not provided
      if (!doc.subscriber_id) {
        doc.subscriber_id = `${doc.source_provider.toUpperCase()}_${doc.original_id}`;
      }
      
      // Calculate age from date of birth
      if (doc.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(doc.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        doc.age = age;
      }
    });
  }
  next();
});

// Static methods for bulk operations
unifiedDatasetSchema.statics.bulkInsertWithMapping = async function(records, mapping, sourceProvider) {
  const mappedRecords = records.map(record => {
    const mappedRecord = { source_provider: sourceProvider };
    
    // Apply field mapping
    Object.keys(mapping).forEach(targetField => {
      const sourceField = mapping[targetField];
      if (record[sourceField] !== undefined && record[sourceField] !== null) {
        mappedRecord[targetField] = record[sourceField];
      }
    });
    
    return mappedRecord;
  });
  
  return this.insertMany(mappedRecords, { ordered: false, rawResult: true });
};

unifiedDatasetSchema.statics.getAdvancedStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 },
        activeSubscribers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        fraudFlagged: {
          $sum: { $cond: ['$is_fraud_flagged', 1, 0] }
        },
        avgRiskScore: { $avg: '$risk_score' },
        prepaidCount: {
          $sum: { $cond: [{ $eq: ['$service_type', 'prepaid'] }, 1, 0] }
        },
        postpaidCount: {
          $sum: { $cond: [{ $eq: ['$service_type', 'postpaid'] }, 1, 0] }
        },
        avgVoiceMinutes: { $avg: '$monthly_usage.voice_minutes' },
        avgSmsCount: { $avg: '$monthly_usage.sms_count' },
        avgDataMB: { $avg: '$monthly_usage.data_mb' }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  return stats[0] || {};
};

module.exports = mongoose.model('UnifiedDataset', unifiedDatasetSchema);
