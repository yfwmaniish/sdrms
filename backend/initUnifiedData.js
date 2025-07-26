const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UnifiedDataset = require('./models/UnifiedDataset');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

// Sample unified dataset records from multiple telecom providers
const sampleUnifiedData = [
  // Airtel subscribers
  {
    source_provider: 'airtel',
    original_id: 'ATL001',
    first_name: 'Rajesh',
    last_name: 'Kumar',
    primary_phone: '9876543210',
    email: 'rajesh.kumar@email.com',
    date_of_birth: new Date('1985-03-15'),
    gender: 'male',
    address: {
      street: '123 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560001',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946
    },
    service_type: 'postpaid',
    plan_name: 'Airtel Infinity 599',
    plan_amount: 599,
    activation_date: new Date('2023-01-15'),
    last_recharge_date: new Date('2024-01-15'),
    account_balance: 150.50,
    monthly_usage: {
      voice_minutes: 450,
      sms_count: 85,
      data_mb: 25600
    },
    kyc_status: 'verified',
    identity_type: 'aadhaar',
    identity_number: '1234-5678-9012',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 15,
    tags: ['premium', 'long-term']
  },
  {
    source_provider: 'airtel',
    original_id: 'ATL002',
    first_name: 'Priya',
    last_name: 'Sharma',
    primary_phone: '9876543211',
    email: 'priya.sharma@email.com',
    date_of_birth: new Date('1990-07-22'),
    gender: 'female',
    address: {
      street: '456 Park Street',
      city: 'Delhi',
      state: 'Delhi',
      postal_code: '110001',
      country: 'India',
      latitude: 28.7041,
      longitude: 77.1025
    },
    service_type: 'prepaid',
    plan_name: 'Airtel Smart Recharge 199',
    plan_amount: 199,
    activation_date: new Date('2023-05-10'),
    last_recharge_date: new Date('2024-01-20'),
    account_balance: 45.75,
    monthly_usage: {
      voice_minutes: 180,
      sms_count: 25,
      data_mb: 8192
    },
    kyc_status: 'verified',
    identity_type: 'pan',
    identity_number: 'ABCDE1234F',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 8,
    tags: ['regular', 'youth']
  },
  // Jio subscribers
  {
    source_provider: 'jio',
    original_id: 'JIO001',
    first_name: 'Amit',
    last_name: 'Patel',
    primary_phone: '9876543212',
    email: 'amit.patel@email.com',
    date_of_birth: new Date('1988-11-05'),
    gender: 'male',
    address: {
      street: '789 Station Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      latitude: 19.0760,
      longitude: 72.8777
    },
    service_type: 'postpaid',
    plan_name: 'Jio Postpaid Plus 799',
    plan_amount: 799,
    activation_date: new Date('2022-12-01'),
    last_recharge_date: new Date('2024-01-18'),
    account_balance: 275.30,
    monthly_usage: {
      voice_minutes: 650,
      sms_count: 120,
      data_mb: 51200
    },
    kyc_status: 'verified',
    identity_type: 'aadhaar',
    identity_number: '2345-6789-0123',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 12,
    tags: ['premium', 'business']
  },
  {
    source_provider: 'jio',
    original_id: 'JIO002',
    first_name: 'Sneha',
    last_name: 'Reddy',
    primary_phone: '9876543213',
    email: 'sneha.reddy@email.com',
    date_of_birth: new Date('1995-02-14'),
    gender: 'female',
    address: {
      street: '321 Tech Park',
      city: 'Hyderabad',
      state: 'Telangana',
      postal_code: '500001',
      country: 'India',
      latitude: 17.3850,
      longitude: 78.4867
    },
    service_type: 'prepaid',
    plan_name: 'Jio Cricket Pack 599',
    plan_amount: 599,
    activation_date: new Date('2023-08-20'),
    last_recharge_date: new Date('2024-01-22'),
    account_balance: 89.25,
    monthly_usage: {
      voice_minutes: 320,
      sms_count: 45,
      data_mb: 30720
    },
    kyc_status: 'verified',
    identity_type: 'voter_id',
    identity_number: 'ABC1234567',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 5,
    tags: ['sports', 'youth']
  },
  // BSNL subscribers
  {
    source_provider: 'bsnl',
    original_id: 'BSN001',
    first_name: 'Ravi',
    last_name: 'Singh',
    primary_phone: '9876543214',
    email: 'ravi.singh@email.com',
    date_of_birth: new Date('1982-09-30'),
    gender: 'male',
    address: {
      street: '654 Civil Lines',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      postal_code: '226001',
      country: 'India',
      latitude: 26.8467,
      longitude: 80.9462
    },
    service_type: 'postpaid',
    plan_name: 'BSNL Experience Unlimited 399',
    plan_amount: 399,
    activation_date: new Date('2023-03-05'),
    last_recharge_date: new Date('2024-01-16'),
    account_balance: 125.80,
    monthly_usage: {
      voice_minutes: 280,
      sms_count: 60,
      data_mb: 15360
    },
    kyc_status: 'verified',
    identity_type: 'aadhaar',
    identity_number: '3456-7890-1234',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 18,
    tags: ['government', 'reliable']
  },
  // Vodafone subscribers
  {
    source_provider: 'vodafone',
    original_id: 'VOD001',
    first_name: 'Deepika',
    last_name: 'Joshi',
    primary_phone: '9876543215',
    email: 'deepika.joshi@email.com',
    date_of_birth: new Date('1992-12-08'),
    gender: 'female',
    address: {
      street: '987 Ring Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      postal_code: '302001',
      country: 'India',
      latitude: 26.9124,
      longitude: 75.7873
    },
    service_type: 'prepaid',
    plan_name: 'Vi Hero Unlimited 249',
    plan_amount: 249,
    activation_date: new Date('2023-06-15'),
    last_recharge_date: new Date('2024-01-19'),
    account_balance: 67.40,
    monthly_usage: {
      voice_minutes: 195,
      sms_count: 30,
      data_mb: 12288
    },
    kyc_status: 'pending',
    identity_type: 'pan',
    identity_number: 'FGHIJ5678K',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 22,
    tags: ['budget', 'student']
  },
  // High-risk/fraud flagged records
  {
    source_provider: 'jio',
    original_id: 'JIO003',
    first_name: 'Suspicious',
    last_name: 'User',
    primary_phone: '9876543216',
    email: 'suspicious@temp.com',
    date_of_birth: new Date('1990-01-01'),
    gender: 'male',
    address: {
      street: 'Unknown Address',
      city: 'Unknown',
      state: 'Unknown',
      postal_code: '000000',
      country: 'India'
    },
    service_type: 'prepaid',
    plan_name: 'Basic Plan',
    plan_amount: 99,
    activation_date: new Date('2024-01-01'),
    last_recharge_date: new Date('2024-01-02'),
    account_balance: 5.00,
    monthly_usage: {
      voice_minutes: 0,
      sms_count: 500,
      data_mb: 100
    },
    kyc_status: 'rejected',
    identity_type: 'other',
    status: 'suspended',
    is_fraud_flagged: true,
    risk_score: 95,
    tags: ['fraud', 'suspicious']
  },
  // Additional diverse records
  {
    source_provider: 'airtel',
    original_id: 'ATL003',
    first_name: 'Manoj',
    last_name: 'Gupta',
    primary_phone: '9876543217',
    email: 'manoj.gupta@business.com',
    date_of_birth: new Date('1975-04-20'),
    gender: 'male',
    address: {
      street: '234 Business District',
      city: 'Pune',
      state: 'Maharashtra',
      postal_code: '411001',
      country: 'India',
      latitude: 18.5204,
      longitude: 73.8567
    },
    service_type: 'postpaid',
    plan_name: 'Airtel Business 1299',
    plan_amount: 1299,
    activation_date: new Date('2021-08-10'),
    last_recharge_date: new Date('2024-01-17'),
    account_balance: 450.90,
    monthly_usage: {
      voice_minutes: 850,
      sms_count: 200,
      data_mb: 102400
    },
    kyc_status: 'verified',
    identity_type: 'aadhaar',
    identity_number: '4567-8901-2345',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 3,
    tags: ['enterprise', 'vip', 'long-term']
  },
  {
    source_provider: 'bsnl',
    original_id: 'BSN002',
    first_name: 'Kavitha',
    last_name: 'Nair',
    primary_phone: '9876543218',
    email: 'kavitha.nair@email.com',
    date_of_birth: new Date('1987-06-12'),
    gender: 'female',
    address: {
      street: '567 Beach Road',
      city: 'Kochi',
      state: 'Kerala',
      postal_code: '682001',
      country: 'India',
      latitude: 9.9312,
      longitude: 76.2673
    },
    service_type: 'prepaid',
    plan_name: 'BSNL Special 199',
    plan_amount: 199,
    activation_date: new Date('2023-04-25'),
    last_recharge_date: new Date('2024-01-21'),
    account_balance: 78.60,
    monthly_usage: {
      voice_minutes: 240,
      sms_count: 40,
      data_mb: 10240
    },
    kyc_status: 'verified',
    identity_type: 'passport',
    identity_number: 'Z1234567',
    status: 'active',
    is_fraud_flagged: false,
    risk_score: 11,
    tags: ['traveler', 'regular']
  }
];

async function initializeUnifiedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing unified dataset records
    console.log('🗑️ Clearing existing unified dataset records...');
    await UnifiedDataset.deleteMany({});
    console.log('✅ Cleared existing records');

    // Process sample data to generate required fields
    console.log('📊 Processing sample unified dataset records...');
    const processedData = sampleUnifiedData.map(record => {
      // Generate subscriber_id if not present
      if (!record.subscriber_id) {
        record.subscriber_id = `${record.source_provider.toUpperCase()}_${record.original_id}`;
      }
      
      // Generate full_name
      if (record.first_name && record.last_name) {
        record.full_name = `${record.first_name} ${record.last_name}`;
      }
      
      // Calculate age from date_of_birth
      if (record.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(record.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        record.age = age;
      }
      
      return record;
    });
    
    // Insert sample unified data
    console.log('📊 Inserting sample unified dataset records...');
    const insertedRecords = await UnifiedDataset.insertMany(processedData);
    console.log(`✅ Inserted ${insertedRecords.length} unified dataset records`);

    // Create admin user if doesn't exist
    console.log('👤 Checking for admin user...');
    const existingAdmin = await User.findOne({ 
      $or: [{ email: 'admin@sdrms.com' }, { username: 'admin' }] 
    });
    
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@sdrms.com',
        password: 'admin123', // Will be hashed by pre-save middleware
        fullName: 'System Administrator',
        department: 'IT',
        designation: 'System Admin',
        role: 'Admin',
        isActive: true,
        isVerified: true
      });
      await adminUser.save();
      console.log('✅ Created admin user (email: admin@sdrms.com, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Display statistics
    const stats = await UnifiedDataset.getAdvancedStats();
    console.log('\n📈 Unified Dataset Statistics:');
    console.log(`Total Subscribers: ${stats.totalSubscribers || 0}`);
    console.log(`Active Subscribers: ${stats.activeSubscribers || 0}`);
    console.log(`Fraud Flagged: ${stats.fraudFlagged || 0}`);
    console.log(`Average Risk Score: ${(stats.avgRiskScore || 0).toFixed(2)}`);
    console.log(`Prepaid Count: ${stats.prepaidCount || 0}`);
    console.log(`Postpaid Count: ${stats.postpaidCount || 0}`);

    // Provider breakdown
    const providerStats = await UnifiedDataset.aggregate([
      {
        $group: {
          _id: '$source_provider',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🏢 Provider Breakdown:');
    providerStats.forEach(provider => {
      console.log(`${provider._id.toUpperCase()}: ${provider.count} total, ${provider.active} active`);
    });

    console.log('\n🎉 Unified dataset initialization completed successfully!');
    console.log('🚀 You can now start the backend server and sync service');
    
  } catch (error) {
    console.error('❌ Error initializing unified data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run initialization
initializeUnifiedData();
