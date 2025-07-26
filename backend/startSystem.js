const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

console.log('🚀 SDRMS System Startup Script');
console.log('='.repeat(40));

let serverProcess;
let testResults = {};

// Function to wait for server to be ready
async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url);
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Function to run API tests
async function runAPITests() {
  try {
    console.log('\n🧪 Running API Tests...');
    
    const BASE_URL = 'http://localhost:3001';
    let authToken = '';

    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health Check: ${healthResponse.data.status}`);

    // Test 2: Authentication
    console.log('\n2️⃣ Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      login: 'admin@sdrms.gov.in',
      password: 'admin123'
    });
    authToken = loginResponse.data.token;
    console.log(`✅ Login: ${loginResponse.data.message}`);
    console.log(`✅ User: ${loginResponse.data.user.fullName} (${loginResponse.data.user.role})`);

    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Test 3: Dataset Statistics
    console.log('\n3️⃣ Testing Dataset Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/bulk/stats`, {
      headers: authHeaders
    });
    console.log(`✅ Dataset Stats: ${statsResponse.data.totalSubscribers} total subscribers`);
    console.log(`   Active: ${statsResponse.data.activeSubscribers}, Fraud: ${statsResponse.data.fraudFlagged}`);

    // Test 4: Advanced Search
    console.log('\n4️⃣ Testing Advanced Search...');
    const searchResponse = await axios.post(`${BASE_URL}/api/unified/advanced-search`, {
      query: 'Rajesh',
      filters: {},
      page: 1,
      limit: 5,
      useOpenSearch: false
    }, { headers: authHeaders });
    console.log(`✅ Search Results: ${searchResponse.data.results.length} found`);
    console.log(`   Total: ${searchResponse.data.pagination.totalCount}`);

    // Test 5: Bulk Search
    console.log('\n5️⃣ Testing Bulk Search...');
    const bulkResponse = await axios.post(`${BASE_URL}/api/unified/bulk-search`, {
      identifiers: ['9876543210', '9876543211', '9876543212'],
      identifierType: 'primary_phone'
    }, { headers: authHeaders });
    console.log(`✅ Bulk Search: ${bulkResponse.data.summary.found}/${bulkResponse.data.summary.requested} found`);

    // Test 6: Analytics
    console.log('\n6️⃣ Testing Analytics...');
    const analyticsResponse = await axios.post(`${BASE_URL}/api/unified/analytics`, {
      groupBy: 'source_provider',
      metrics: ['count', 'active_count'],
      filters: {}
    }, { headers: authHeaders });
    console.log(`✅ Analytics: ${analyticsResponse.data.analyticsData.length} provider groups`);

    // Test 7: Geographic Search
    console.log('\n7️⃣ Testing Geographic Search...');
    const geoResponse = await axios.get(`${BASE_URL}/api/unified/geo-search?city=Mumbai&limit=5`, {
      headers: authHeaders
    });
    console.log(`✅ Geographic Search: ${geoResponse.data.results.length} Mumbai subscribers`);

    // Test 8: Mapping Suggestions
    console.log('\n8️⃣ Testing Mapping Suggestions...');
    const mappingResponse = await axios.post(`${BASE_URL}/api/bulk/suggest-mapping`, {
      sampleData: [{
        'Customer Name': 'John Doe',
        'Phone Number': '9999999999',
        'Email': 'john@test.com'
      }]
    }, { headers: authHeaders });
    console.log(`✅ Mapping Suggestions: ${Object.keys(mappingResponse.data.suggestions).length} suggestions`);

    console.log('\n🎉 ALL API TESTS PASSED!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Health Check: Working');
    console.log('✅ Authentication: Working');  
    console.log('✅ Dataset Statistics: Working');
    console.log('✅ Advanced Search: Working');
    console.log('✅ Bulk Search: Working');
    console.log('✅ Analytics: Working');
    console.log('✅ Geographic Search: Working');
    console.log('✅ Field Mapping: Working');

    return true;

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    return false;
  }
}

// Main startup function
async function startSystem() {
  try {
    console.log('\n🔧 Starting SDRMS Backend Server...');
    
    // Start the server
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'pipe',
      env: { ...process.env, PORT: '3001' }
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server ready')) {
        console.log('✅ Server started successfully!');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('Warning')) {
        console.error('Server error:', error);
      }
    });

    // Wait for server to be ready
    const serverReady = await waitForServer('http://localhost:3001/health');
    
    if (serverReady) {
      console.log('✅ Server is ready and responding!');
      
      // Run API tests
      const testsPass = await runAPITests();
      
      if (testsPass) {
        console.log('\n🌟 SDRMS System is fully operational!');
        console.log('\n📋 Server Information:');
        console.log('🌐 Base URL: http://localhost:3001');
        console.log('📖 Health Check: http://localhost:3001/health');
        console.log('🔐 Login Endpoint: POST /api/auth/login');
        console.log('📊 API Documentation: All endpoints working');
        
        console.log('\n⚡ Keep this process running to maintain the server');
        console.log('Press Ctrl+C to stop the server');
        
        // Keep the process alive
        process.stdin.resume();
        
      } else {
        console.log('❌ API tests failed');
        process.exit(1);
      }
    } else {
      console.log('❌ Server failed to start within timeout period');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ System startup failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SDRMS system...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating SDRMS system...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the system
startSystem();
