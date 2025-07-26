const mongoose = require('mongoose');

// Connect to MongoDB replica set
async function connectMongoDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sdrms?replicaSet=sdrms-rs');
    console.log('✅ Connected to MongoDB replica set');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Test real-time sync by adding a new subscriber
async function testRealTimeSync() {
  if (!(await connectMongoDB())) {
    process.exit(1);
  }

  console.log('🧪 Testing real-time synchronization...');
  console.log('=====================================');

  const collection = mongoose.connection.collection('subscribers');

  // Add a new subscriber
  const newSubscriber = {
    subscriberName: 'Test User Real Time',
    fatherName: 'Test Father',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    mobileNumber: '9999999999',
    emailId: 'testuser@realtime.com',
    address: {
      street: 'Test Address',
      city: 'Test City',
      district: 'Test District',
      state: 'Haryana',
      pincode: '123456'
    },
    identityDocuments: [{
      docType: 'Aadhaar',
      docNumber: 'TEST-1234-5678',
      isVerified: true
    }],
    simDetails: {
      simId: 'SIM-TEST-REALTIME',
      imsi: '404451111111111',
      iccid: '8991404451111111111',
      connectionType: 'Prepaid',
      activationDate: new Date(),
      status: 'Active'
    },
    deviceInfo: {
      imei: '111111111111111',
      deviceModel: 'Test Device',
      deviceBrand: 'Test Brand'
    },
    operatorDetails: {
      operatorName: 'Airtel',
      circle: 'Haryana',
      serviceProvider: 'Test Provider'
    },
    dataSource: {
      fileName: 'realtime_test.csv',
      sourceFormat: 'CSV',
      uploadDate: new Date()
    },
    fraudFlags: {
      isSuspicious: false,
      isVerified: true
    },
    metadata: {
      priority: 'High',
      confidence: 100
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('📄 Adding new subscriber:', newSubscriber.subscriberName);
  const insertResult = await collection.insertOne(newSubscriber);
  console.log('✅ Document inserted with ID:', insertResult.insertedId);

  // Wait a moment for sync
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Update the document
  console.log('🔄 Updating subscriber status...');
  await collection.updateOne(
    { _id: insertResult.insertedId },
    { 
      $set: { 
        'simDetails.status': 'Suspended',
        'fraudFlags.isSuspicious': true,
        'fraudFlags.suspiciousReasons': ['Real-time sync test'],
        updatedAt: new Date()
      }
    }
  );
  console.log('✅ Document updated');

  // Wait a moment for sync
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Delete the test document
  console.log('🗑️ Deleting test subscriber...');
  await collection.deleteOne({ _id: insertResult.insertedId });
  console.log('✅ Document deleted');

  console.log('');
  console.log('🎉 Real-time sync test completed!');
  console.log('📊 Check the sync service logs to see the change stream events');
  console.log('🔍 You can also verify the changes in OpenSearch');

  await mongoose.connection.close();
  console.log('👋 Connection closed');
}

// Run the test
testRealTimeSync().catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
