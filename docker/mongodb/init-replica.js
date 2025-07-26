// MongoDB Replica Set Initialization Script
// This script initializes a single-node replica set for development

print('🚀 Starting MongoDB Replica Set Initialization...');

// Wait for MongoDB to be ready
function waitForMongoDB() {
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      db.adminCommand('ping');
      print('✅ MongoDB is ready');
      return true;
    } catch (e) {
      print(`⏳ Waiting for MongoDB... (${attempts + 1}/${maxAttempts})`);
      sleep(2000);
      attempts++;
    }
  }
  
  print('❌ MongoDB failed to become ready');
  return false;
}

// Initialize replica set
function initializeReplicaSet() {
  try {
    print('📋 Checking replica set status...');
    
    // Check if replica set is already initialized
    let rsStatus;
    try {
      rsStatus = rs.status();
      print('✅ Replica set already initialized');
      print(`📊 Current status: ${rsStatus.ok ? 'OK' : 'Not OK'}`);
      return true;
    } catch (e) {
      if (e.message.includes('no replset config has been received')) {
        print('🔧 Replica set not initialized, proceeding with initialization...');
      } else {
        print('❌ Error checking replica set status:', e.message);
        return false;
      }
    }
    
    // Configure replica set
    const config = {
      _id: 'sdrms-rs',
      version: 1,
      members: [
        { 
          _id: 0, 
          host: 'sdrms-mongodb:27017',
          priority: 1
        }
      ]
    };
    
    print('🔧 Initializing replica set with config:');
    printjson(config);
    
    const result = rs.initiate(config);
    print('📊 Replica set initialization result:');
    printjson(result);
    
    if (result.ok === 1) {
      print('✅ Replica set initialized successfully');
      
      // Wait for replica set to become ready
      print('⏳ Waiting for replica set to become primary...');
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        try {
          const status = rs.status();
          const primary = status.members.find(member => member.state === 1);
          
          if (primary) {
            print('✅ Replica set is ready and primary node is available');
            print(`📊 Primary node: ${primary.name}`);
            return true;
          }
          
          print(`⏳ Waiting for primary... (${attempts + 1}/${maxAttempts})`);
          sleep(2000);
          attempts++;
        } catch (e) {
          print(`⏳ Waiting for replica set... (${attempts + 1}/${maxAttempts})`);
          sleep(2000);
          attempts++;
        }
      }
      
      print('⚠️ Replica set initialized but primary not ready within timeout');
      return true;
    } else {
      print('❌ Failed to initialize replica set');
      return false;
    }
  } catch (e) {
    print('❌ Error during replica set initialization:', e.message);
    return false;
  }
}

// Main execution
if (waitForMongoDB()) {
  if (initializeReplicaSet()) {
    print('🎉 MongoDB Replica Set setup completed successfully!');
    print('🔄 Change streams are now enabled for real-time synchronization');
  } else {
    print('💥 Failed to set up replica set');
  }
} else {
  print('💥 Failed to connect to MongoDB');
}
