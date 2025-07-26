const mongoose = require('mongoose');

// Address schema
const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true }
}, { _id: false });

// Identity document schema
const identityDocumentSchema = new mongoose.Schema({
  docType: { 
    type: String, 
    required: true,
    enum: ['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Driving License']
  },
  docNumber: { type: String, required: true },
  isVerified: { type: Boolean, default: false }
}, { _id: false });

// SIM details schema
const simDetailsSchema = new mongoose.Schema({
  simId: { type: String, required: true, unique: true },
  imsi: { type: String },
  iccid: { type: String },
  connectionType: { 
    type: String, 
    enum: ['Prepaid', 'Postpaid'], 
    required: true 
  },
  activationDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended', 'Terminated'],
    default: 'Active'
  }
}, { _id: false });

// Device info schema
const deviceInfoSchema = new mongoose.Schema({
  imei: { type: String, required: true },
  deviceModel: { type: String },
  deviceBrand: { type: String }
}, { _id: false });

// Operator details schema
const operatorDetailsSchema = new mongoose.Schema({
  operatorName: { 
    type: String, 
    required: true,
    enum: ['Airtel', 'Jio', 'Vi', 'BSNL', 'MTNL']
  },
  circle: { type: String, required: true },
  serviceProvider: { type: String, required: true }
}, { _id: false });

// Data source schema
const dataSourceSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  sourceFormat: { 
    type: String, 
    enum: ['CSV', 'Excel', 'JSON', 'API'],
    required: true 
  },
  uploadDate: { type: Date, default: Date.now }
}, { _id: false });

// Fraud flags schema
const fraudFlagsSchema = new mongoose.Schema({
  isSuspicious: { type: Boolean, default: false },
  suspiciousReasons: [{ type: String }],
  flaggedDate: { type: Date },
  isVerified: { type: Boolean, default: false }
}, { _id: false });

// Metadata schema
const metadataSchema = new mongoose.Schema({
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  confidence: { type: Number, min: 0, max: 100, default: 100 },
  tags: [{ type: String }]
}, { _id: false });

// Main subscriber schema
const subscriberSchema = new mongoose.Schema({
  subscriberName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  fatherName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  dateOfBirth: { type: Date, required: true },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: true 
  },
  mobileNumber: { 
    type: String, 
    required: true,
    unique: true,
    match: /^[6-9]\d{9}$/
  },
  emailId: { 
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  address: { type: addressSchema, required: true },
  identityDocuments: [identityDocumentSchema],
  simDetails: { type: simDetailsSchema, required: true },
  deviceInfo: { type: deviceInfoSchema, required: true },
  operatorDetails: { type: operatorDetailsSchema, required: true },
  dataSource: { type: dataSourceSchema, required: true },
  fraudFlags: { type: fraudFlagsSchema, default: {} },
  metadata: { type: metadataSchema, default: {} }
}, {
  timestamps: true,
  collection: 'subscribers'
});

// Indexes for better performance
subscriberSchema.index({ mobileNumber: 1 });
subscriberSchema.index({ 'simDetails.simId': 1 });
subscriberSchema.index({ 'deviceInfo.imei': 1 });
subscriberSchema.index({ subscriberName: 'text', fatherName: 'text' });
subscriberSchema.index({ 'address.city': 1, 'address.district': 1 });
subscriberSchema.index({ 'fraudFlags.isSuspicious': 1 });
subscriberSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Subscriber', subscriberSchema);
