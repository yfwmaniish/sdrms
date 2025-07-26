// MongoDB Replica Set Initialization Script for SDRMS

print('Starting MongoDB replica set initialization...');

// Wait for MongoDB to be ready
sleep(5000);

try {
  // Initialize replica set
  rs.initiate({
    _id: "rs0",
    members: [
      {
        _id: 0,
        host: "mongodb:27017",
        priority: 1
      }
    ]
  });

  print('✅ Replica set initialized successfully');

  // Wait for replica set to be ready
  sleep(10000);

  // Switch to the SDRMS database
  db = db.getSiblingDB('sdrms');

  // Create collections with initial indexes
  print('Creating collections and indexes...');

  // Users collection
  db.createCollection('users');
  db.users.createIndex({ "email": 1 }, { "unique": true });
  db.users.createIndex({ "username": 1 }, { "unique": true });
  db.users.createIndex({ "employeeId": 1 }, { "unique": true, "sparse": true });
  db.users.createIndex({ "role": 1 });
  db.users.createIndex({ "isActive": 1 });

  // Subscribers collection
  db.createCollection('subscribers');
  db.subscribers.createIndex({ "mobileNumber": 1 }, { "unique": true });
  db.subscribers.createIndex({ "simDetails.simId": 1 }, { "unique": true });
  db.subscribers.createIndex({ "subscriberName": "text", "address.city": "text", "address.district": "text" });
  db.subscribers.createIndex({ "address.district": 1 });
  db.subscribers.createIndex({ "address.city": 1 });
  db.subscribers.createIndex({ "operatorDetails.operatorName": 1 });
  db.subscribers.createIndex({ "simDetails.status": 1 });
  db.subscribers.createIndex({ "fraudFlags.isSuspicious": 1 });
  db.subscribers.createIndex({ "deviceInfo.imei": 1 });
  db.subscribers.createIndex({ "createdAt": -1 });
  db.subscribers.createIndex({ "updatedAt": -1 });

  // Create compound indexes for better performance
  db.subscribers.createIndex({ "address.district": 1, "simDetails.status": 1 });
  db.subscribers.createIndex({ "operatorDetails.operatorName": 1, "address.district": 1 });
  db.subscribers.createIndex({ "fraudFlags.isSuspicious": 1, "fraudFlags.flaggedDate": -1 });

  print('✅ Collections and indexes created successfully');

  // Create initial admin user
  const adminUser = {
    username: 'admin',
    email: 'admin@sdrms.gov.in',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeUfOpqmirSH0c4j2', // Default: admin123
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

  db.users.insertOne(adminUser);
  print('✅ Default admin user created (username: admin, password: admin123)');

  // Create sample subscriber data for testing
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
    }
  ];

  db.subscribers.insertMany(sampleSubscribers);
  print('✅ Sample subscriber data inserted');

  print('🎉 MongoDB initialization completed successfully!');
  print('📊 Database: sdrms');
  print('👤 Admin User: admin / admin123');
  print('📱 Sample Data: 2 subscribers added');

} catch (error) {
  print('❌ Error during MongoDB initialization:');
  print(error);
}
