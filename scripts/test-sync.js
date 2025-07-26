const mongoose = require('mongoose');
const { Client } = require('@opensearch-project/opensearch');
require('dotenv').config();

// Initialize OpenSearch client
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200'
});

// Connect to MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdrms?replicaSet=sdrms-rs');
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

// Test OpenSearch connection
async function testOpenSearchConnection() {
  try {
    const response = await opensearchClient.ping();
    console.log('✅ OpenSearch connection successful');
    return true;
  } catch (error) {
    console.error('❌ OpenSearch connection failed:', error.message);
    return false;
  }
}

// Create OpenSearch index with proper mapping
async function createSubscribersIndex() {
  try {
    const indexExists = await opensearchClient.indices.exists({
      index: 'subscribers'
    });

    if (!indexExists.body) {
      console.log('📋 Creating OpenSearch subscribers index...');
      
      const indexMapping = {
        mappings: {
          properties: {
            subscriberName: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            fatherName: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            mobileNumber: { 
              type: 'keyword',
              fields: {
                text: { type: 'text' }
              }
            },
            address: {
              properties: {
                street: { type: 'text' },
                city: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                district: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                state: { type: 'keyword' },
                pincode: { type: 'keyword' }
              }
            },
            simDetails: {
              properties: {
                simId: { type: 'keyword' },
                status: { type: 'keyword' },
                connectionType: { type: 'keyword' },
                activationDate: { type: 'date' }
              }
            },
            deviceInfo: {
              properties: {
                imei: { type: 'keyword' },
                deviceModel: { type: 'keyword' },
                deviceBrand: { type: 'keyword' }
              }
            },
            operatorDetails: {
              properties: {
                operatorName: { type: 'keyword' },
                circle: { type: 'keyword' },
                serviceProvider: { type: 'keyword' }
              }
            },
            fraudFlags: {
              properties: {
                isSuspicious: { type: 'boolean' },
                suspiciousReasons: { type: 'keyword' },
                flaggedDate: { type: 'date' }
              }
            },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        }
      };

      await opensearchClient.indices.create({
        index: 'subscribers',
        body: indexMapping
      });

      console.log('✅ OpenSearch subscribers index created successfully');
    } else {
      console.log('📋 OpenSearch subscribers index already exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating OpenSearch index:', error);
    return false;
  }
}

// Sync existing MongoDB data to OpenSearch
async function syncExistingData() {
  try {
    console.log('🔄 Starting initial data sync from MongoDB to OpenSearch...');
    
    const subscribersCollection = mongoose.connection.collection('subscribers');
    const cursor = subscribersCollection.find({});
    
    let synced = 0;
    const batch = [];
    const batchSize = 100;
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      
      // Prepare document for OpenSearch (remove MongoDB-specific fields)
      const { _id, __v, ...cleanDoc } = doc;
      
      // Add to batch
      batch.push({
        index: {
          _index: 'subscribers',
          _id: _id.toString()
        }
      });
      batch.push(cleanDoc);
      
      if (batch.length >= batchSize * 2) { // * 2 because each doc has 2 entries (action + document)
        await bulkIndex(batch);
        synced += batchSize;
        console.log(`📊 Synced ${synced} documents...`);
        batch.length = 0; // Clear batch
      }
    }
    
    // Process remaining documents
    if (batch.length > 0) {
      await bulkIndex(batch);
      synced += batch.length / 2;
    }
    
    console.log(`✅ Initial sync completed: ${synced} documents synchronized`);
    return synced;
  } catch (error) {
    console.error('❌ Error during initial sync:', error);
    return 0;
  }
}

// Bulk index documents to OpenSearch
async function bulkIndex(batch) {
  try {
    const response = await opensearchClient.bulk({
      body: batch,
      refresh: 'wait_for'
    });
    
    if (response.body.errors) {
      console.warn('⚠️ Some documents had indexing errors');
      response.body.items.forEach((item, index) => {
        if (item.index?.error) {
          console.error(`❌ Error indexing document ${index}:`, item.index.error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Bulk indexing error:', error);
  }
}

// Test search functionality
async function testSearch() {
  try {
    console.log('🔍 Testing OpenSearch functionality...');
    
    // Test basic search
    const searchResponse = await opensearchClient.search({
      index: 'subscribers',
      body: {
        query: {
          match_all: {}
        },
        size: 5
      }
    });
    
    console.log(`📊 Search test successful: Found ${searchResponse.body.hits.total.value} documents`);
    
    if (searchResponse.body.hits.hits.length > 0) {
      console.log('📄 Sample document:');
      console.log(JSON.stringify(searchResponse.body.hits.hits[0]._source, null, 2));
    }
    
    // Test specific search
    const nameSearch = await opensearchClient.search({
      index: 'subscribers',
      body: {
        query: {
          match: {
            subscriberName: 'Raj'
          }
        }
      }
    });
    
    console.log(`🔍 Name search test: Found ${nameSearch.body.hits.total.value} matches for 'Raj'`);
    
    return true;
  } catch (error) {
    console.error('❌ Search test failed:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 SDRMS Sync Test & Setup');
  console.log('===========================');
  
  // Connect to MongoDB
  if (!(await connectMongoDB())) {
    process.exit(1);
  }
  
  // Test OpenSearch connection
  if (!(await testOpenSearchConnection())) {
    process.exit(1);
  }
  
  // Create OpenSearch index
  if (!(await createSubscribersIndex())) {
    process.exit(1);
  }
  
  // Sync existing data
  const syncedCount = await syncExistingData();
  
  if (syncedCount > 0) {
    // Test search functionality
    await testSearch();
  }
  
  console.log('🎉 Sync test completed successfully!');
  console.log('🔄 You can now start the sync service to monitor real-time changes');
  
  // Close connections
  await mongoose.connection.close();
  await opensearchClient.close();
  console.log('👋 Connections closed');
}

// Run the test
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
