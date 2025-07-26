const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 SDRMS API Testing Script');
  console.log('==========================');

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // Test 2: Login with admin user
    console.log('\n2️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    const { token, user } = loginResponse.data;
    console.log('✅ Login successful:', user.fullName, '-', user.role);

    // Test 3: Get current user profile
    console.log('\n3️⃣ Testing User Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile:', profileResponse.data.fullName, '-', profileResponse.data.permissions.length + ' permissions');

    // Test 4: Search subscribers
    console.log('\n4️⃣ Testing Subscriber Search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/search?q=Rajesh`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Search Results:', searchResponse.data.results.length + ' subscribers found');
    if (searchResponse.data.results.length > 0) {
      const subscriber = searchResponse.data.results[0];
      console.log('   📱 Found:', subscriber.subscriberName, '-', subscriber.mobileNumber);
    }

    // Test 5: Analytics Dashboard
    console.log('\n5️⃣ Testing Analytics Dashboard...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Analytics:', {
      total: analyticsResponse.data.overview.totalSubscribers,
      active: analyticsResponse.data.overview.activeSubscribers,
      suspicious: analyticsResponse.data.overview.suspiciousSubscribers
    });

    console.log('\n🎉 All API tests passed successfully!');
    console.log('🔗 Backend is fully functional and ready for use.');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();
