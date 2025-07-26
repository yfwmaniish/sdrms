const axios = require('axios');

async function testBackendAPI() {
  const baseURL = 'http://localhost:3002';
  
  console.log('🧪 Testing SDRMS Backend API');
  console.log('============================');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Get all subscribers
    console.log('\n2. Testing subscribers endpoint...');
    const subscribersResponse = await axios.get(`${baseURL}/api/subscribers`);
    console.log('✅ Subscribers found:', subscribersResponse.data.pagination.total);

    // Test 3: Search functionality
    console.log('\n3. Testing search endpoint...');
    const searchResponse = await axios.get(`${baseURL}/api/subscribers/search?q=Rajesh`);
    console.log('✅ Search results:', searchResponse.data.data.length, 'matches');

    // Test 4: Analytics endpoint
    console.log('\n4. Testing analytics endpoint...');
    const analyticsResponse = await axios.get(`${baseURL}/api/analytics/overview`);
    console.log('✅ Analytics data:', Object.keys(analyticsResponse.data.data));

    console.log('\n🎉 All API tests passed! Backend is working correctly.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running. Please start it first.');
    } else {
      console.error('❌ API test failed:', error.response?.data || error.message);
    }
  }
}

testBackendAPI();
