const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sdrms';

console.log('🔧 SDRMS Database Setup Script');
console.log('================================');

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Drop existing database to start fresh
    console.log('🗑️ Dropping existing database...');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database dropped successfully');

    // Create Users collection and indexes
    console.log('👤 Setting up Users collection...');
    const usersCollection = mongoose.connection.collection('users');
    
    // Create indexes for users
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ isActive: 1 });
    
    console.log('✅ Users collection indexes created');

    // Create Subscribers collection and indexes
    console.log('📱 Setting up Subscribers collection...');
    const subscribersCollection = mongoose.connection.collection('subscribers');
    
    // Create indexes for subscribers
    await subscribersCollection.createIndex({ mobileNumber: 1 }, { unique: true });
    await subscribersCollection.createIndex({ 'simDetails.simId': 1 }, { unique: true });
    await subscribersCollection.createIndex({ subscriberName: 'text', 'address.city': 'text', 'address.district': 'text' });
    await subscribersCollection.createIndex({ 'address.district': 1 });
    await subscribersCollection.createIndex({ 'address.city': 1 });
    await subscribersCollection.createIndex({ 'operatorDetails.operatorName': 1 });
    await subscribersCollection.createIndex({ 'simDetails.status': 1 });
    await subscribersCollection.createIndex({ 'fraudFlags.isSuspicious': 1 });
    await subscribersCollection.createIndex({ 'deviceInfo.imei': 1 });
    await subscribersCollection.createIndex({ createdAt: -1 });
    await subscribersCollection.createIndex({ updatedAt: -1 });
    
    // Compound indexes for better performance
    await subscribersCollection.createIndex({ 'address.district': 1, 'simDetails.status': 1 });
    await subscribersCollection.createIndex({ 'operatorDetails.operatorName': 1, 'address.district': 1 });
    await subscribersCollection.createIndex({ 'fraudFlags.isSuspicious': 1, 'fraudFlags.flaggedDate': -1 });
    
    console.log('✅ Subscribers collection indexes created');

    // Create initial admin user
    console.log('👨‍💼 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@sdrms.gov.in',
      password: hashedPassword,
      fullName: 'System Administrator',
      employeeId: 'SDRMS001',
      department: 'IT Administration',
      designation: 'System Admin',
      role: 'Admin',
      permissions: [
        'read_subscribers',
        'write_subscribers',
        'delete_subscribers',
        'upload_data',
        'manage_users',
        'view_analytics',
        'flag_suspicious',
        'export_data'
      ],
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created (username: admin, password: admin123)');

    // Create sample subscriber data
    console.log('📊 Creating sample subscriber data...');
    const sampleSubscribers = [
      {
        subscriberName: 'Rajesh Kumar',
        fatherName: 'Ram Kumar',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'Male',
        mobileNumber: '9876543210',
        emailId: 'rajesh.kumar@example.com',
        address: {
          street: 'House No. 123, Sector 15',
          city: 'Gurgaon',
          district: 'Gurugram',
          state: 'Haryana',
          pincode: '122001'
        },
        identityDocuments: [{
          docType: 'Aadhaar',
          docNumber: '1234-5678-9012',
          isVerified: true
        }],
        simDetails: {
          simId: 'SIM001234567890',
          imsi: '404451234567890',
          iccid: '8991404451234567890',
          connectionType: 'Prepaid',
          activationDate: new Date('2023-01-15'),
          status: 'Active'
        },
        deviceInfo: {
          imei: '123456789012345',
          deviceModel: 'Samsung Galaxy A50',
          deviceBrand: 'Samsung'
        },
        operatorDetails: {
          operatorName: 'Airtel',
          circle: 'Haryana',
          serviceProvider: 'Bharti Airtel'
        },
        dataSource: {
          fileName: 'sample_data.csv',
          sourceFormat: 'CSV',
          uploadDate: new Date()
        },
        fraudFlags: {
          isSuspicious: false,
          isVerified: true
        },
        metadata: {
          priority: 'Medium',
          confidence: 100
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        subscriberName: 'Priya Sharma',
        fatherName: 'Vijay Sharma',
        dateOfBirth: new Date('1992-08-22'),
        gender: 'Female',
        mobileNumber: '8765432109',
        emailId: 'priya.sharma@example.com',
        address: {
          street: 'Plot No. 456, Phase 2',
          city: 'Faridabad',
          district: 'Faridabad',
          state: 'Haryana',
          pincode: '121002'
        },
        identityDocuments: [{
          docType: 'PAN',
          docNumber: 'ABCDE1234F',
          isVerified: true
        }],
        simDetails: {
          simId: 'SIM009876543210',
          imsi: '404459876543210',
          iccid: '8991404459876543210',
          connectionType: 'Postpaid',
          activationDate: new Date('2023-03-10'),
          status: 'Active'
        },
        deviceInfo: {
          imei: '987654321098765',
          deviceModel: 'iPhone 12',
          deviceBrand: 'Apple'
        },
        operatorDetails: {
          operatorName: 'Jio',
          circle: 'Haryana',
          serviceProvider: 'Reliance Jio'
        },
        dataSource: {
          fileName: 'sample_data.csv',
          sourceFormat: 'CSV',
          uploadDate: new Date()
        },
        fraudFlags: {
          isSuspicious: false,
          isVerified: true
        },
        metadata: {
          priority: 'Medium',
          confidence: 100
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        subscriberName: 'Amit Gupta',
        fatherName: 'Suresh Gupta',
        dateOfBirth: new Date('1988-12-10'),
        gender: 'Male',
        mobileNumber: '7654321098',
        address: {
          street: 'Village Bahadurgarh',
          city: 'Bahadurgarh',
          district: 'Jhajjar',
          state: 'Haryana',
          pincode: '124507'
        },
        identityDocuments: [{
          docType: 'Voter ID',
          docNumber: 'BLA1234567',
          isVerified: false
        }],
        simDetails: {
          simId: 'SIM007654321098',
          connectionType: 'Prepaid',
          activationDate: new Date('2023-06-20'),
          status: 'Suspended'
        },
        deviceInfo: {
          imei: '456789012345678',
          deviceModel: 'Redmi Note 10',
          deviceBrand: 'Xiaomi'
        },
        operatorDetails: {
          operatorName: 'Vi',
          circle: 'Haryana',
          serviceProvider: 'Vodafone Idea'
        },
        dataSource: {
          fileName: 'suspicious_data.csv',
          sourceFormat: 'CSV',
          uploadDate: new Date()
        },
        fraudFlags: {
          isSuspicious: true,
          suspiciousReasons: ['Invalid Documents', 'Unusual Activity'],
          flaggedDate: new Date('2023-07-15'),
          isVerified: false
        },
        metadata: {
          priority: 'High',
          confidence: 75
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await subscribersCollection.insertMany(sampleSubscribers);
    console.log('✅ Sample subscribers inserted (3 records)');

    // Display summary
    console.log('\n🎉 Database setup completed successfully!');
    console.log('========================================');
    console.log('📊 Database: sdrms');
    console.log('👤 Admin User: admin / admin123');
    console.log('📱 Sample Data: 3 subscribers (1 flagged as suspicious)');
    console.log('🔍 Collections: users, subscribers');
    console.log('📈 Indexes: Optimized for search and performance');
    
    // Show collection stats
    const userCount = await usersCollection.countDocuments();
    const subscriberCount = await subscribersCollection.countDocuments();
    const suspiciousCount = await subscribersCollection.countDocuments({ 'fraudFlags.isSuspicious': true });
    
    console.log('\n📊 Collection Statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Subscribers: ${subscriberCount}`);
    console.log(`   Suspicious: ${suspiciousCount}`);

    // Display connection info
    console.log('\n🔗 Connection Details:');
    console.log(`   MongoDB URI: ${MONGODB_URI}`);
    console.log('   Ready for backend connection!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run setup
setupDatabase();
