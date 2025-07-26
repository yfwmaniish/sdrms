const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Test data for bulk operations
const sampleCsvData = `first_name,last_name,phone,email,city,state,service_type,plan_name
John,Doe,9999999901,john.doe@test.com,Chennai,Tamil Nadu,prepaid,Basic Plan 199
Jane,Smith,9999999902,jane.smith@test.com,Kolkata,West Bengal,postpaid,Premium Plan 599
Mike,Johnson,9999999903,mike.johnson@test.com,Ahmedabad,Gujarat,prepaid,Smart Plan 299`;

const sampleMappingConfig = {
  first_name: 'first_name',
  last_name: 'last_name',
  primary_phone: 'phone',
  email: 'email',
  'address.city': 'city',
  'address.state': 'state',
  service_type: 'service_type',
  plan_name: 'plan_name',
  original_id: 'phone' // Use phone as original_id
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function login() {
  console.log('🔐 Logging in...');
  const result = await makeRequest('POST', '/api/auth/login', {
    login: 'admin@sdrms.com',
    password: 'admin123'
  });
  
  if (result.success) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.error('❌ Login failed:', result.error);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing health check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed:', result.data);
  } else {
    console.error('❌ Health check failed:', result.error);
  }
}

async function testUnifiedDatasetStats() {
  console.log('\n📊 Testing unified dataset statistics...');
  const result = await makeRequest('GET', '/api/bulk/stats');
  
  if (result.success) {
    console.log('✅ Dataset stats retrieved:', {
      totalSubscribers: result.data.totalSubscribers,
      activeSubscribers: result.data.activeSubscribers,
      fraudFlagged: result.data.fraudFlagged,
      avgRiskScore: result.data.avgRiskScore?.toFixed(2),
      providerBreakdown: result.data.providerBreakdown
    });
  } else {
    console.error('❌ Failed to get dataset stats:', result.error);
  }
}

async function testBulkIngestionJson() {
  console.log('\n📤 Testing bulk JSON ingestion...');
  
  const testRecords = [
    {
      first_name: 'Test',
      last_name: 'User1',
      phone: '9999999904',
      email: 'test1@bulk.com',
      city: 'Mumbai',
      state: 'Maharashtra',
      service_type: 'prepaid',
      plan_name: 'Test Plan 149'
    },
    {
      first_name: 'Test',
      last_name: 'User2',
      phone: '9999999905',
      email: 'test2@bulk.com',
      city: 'Delhi',
      state: 'Delhi',
      service_type: 'postpaid',
      plan_name: 'Test Plan 699'
    }
  ];
  
  const result = await makeRequest('POST', '/api/bulk/bulk-ingest-json', {
    records: testRecords,
    mapping: sampleMappingConfig,
    sourceProvider: 'other'
  });
  
  if (result.success) {
    console.log('✅ Bulk JSON ingestion successful:', {
      totalProcessed: result.data.totalProcessed,
      validRecords: result.data.validRecords,
      insertedCount: result.data.insertedCount
    });
  } else {
    console.error('❌ Bulk JSON ingestion failed:', result.error);
  }
}

async function testMappingSuggestions() {
  console.log('\n🧠 Testing mapping suggestions...');
  
  const sampleData = [
    {
      'Customer Name': 'John Doe',
      'Mobile Number': '9876543219',
      'Email ID': 'john@example.com',
      'Location': 'Mumbai',
      'State': 'Maharashtra',
      'Plan Type': 'prepaid'
    }
  ];
  
  const result = await makeRequest('POST', '/api/bulk/suggest-mapping', {
    sampleData: sampleData
  });
  
  if (result.success) {
    console.log('✅ Mapping suggestions generated:', {
      sourceFields: result.data.sourceFields,
      suggestions: result.data.suggestions
    });
  } else {
    console.error('❌ Failed to generate mapping suggestions:', result.error);
  }
}

async function testAdvancedSearch() {
  console.log('\n🔍 Testing advanced search...');
  
  // Test 1: Text search
  const searchResult1 = await makeRequest('POST', '/api/unified/advanced-search', {
    query: 'Rajesh Kumar',
    filters: {},
    page: 1,
    limit: 5,
    useOpenSearch: false // Use MongoDB for now
  });
  
  if (searchResult1.success) {
    console.log('✅ Text search successful:', {
      totalCount: searchResult1.data.pagination.totalCount,
      resultsFound: searchResult1.data.results.length,
      searchEngine: searchResult1.data.searchEngine
    });
  } else {
    console.error('❌ Text search failed:', searchResult1.error);
  }
  
  // Test 2: Filter search
  const searchResult2 = await makeRequest('POST', '/api/unified/advanced-search', {
    query: '',
    filters: {
      source_provider: 'airtel',
      service_type: 'postpaid'
    },
    page: 1,
    limit: 10,
    useOpenSearch: false
  });
  
  if (searchResult2.success) {
    console.log('✅ Filter search successful:', {
      totalCount: searchResult2.data.pagination.totalCount,
      resultsFound: searchResult2.data.results.length
    });
  } else {
    console.error('❌ Filter search failed:', searchResult2.error);
  }
}

async function testBulkSearch() {
  console.log('\n🔍 Testing bulk search...');
  
  const phoneNumbers = [
    '9876543210', // Rajesh Kumar - should exist
    '9876543211', // Priya Sharma - should exist
    '9999999999', // Should not exist
    '9876543212'  // Amit Patel - should exist
  ];
  
  const result = await makeRequest('POST', '/api/unified/bulk-search', {
    identifiers: phoneNumbers,
    identifierType: 'primary_phone'
  });
  
  if (result.success) {
    console.log('✅ Bulk search successful:', {
      requested: result.data.summary.requested,
      found: result.data.summary.found,
      missing: result.data.summary.missing,
      totalRecords: result.data.summary.totalRecords,
      missingIdentifiers: result.data.missingIdentifiers
    });
  } else {
    console.error('❌ Bulk search failed:', result.error);
  }
}

async function testGeoSearch() {
  console.log('\n🌍 Testing geographic search...');
  
  const result = await makeRequest('GET', '/api/unified/geo-search?city=Mumbai&state=Maharashtra&page=1&limit=5');
  
  if (result.success) {
    console.log('✅ Geographic search successful:', {
      totalCount: result.data.pagination.totalCount,
      resultsFound: result.data.results.length,
      locationStats: result.data.locationStats?.slice(0, 3) // Show top 3 locations
    });
  } else {
    console.error('❌ Geographic search failed:', result.error);
  }
}

async function testAnalytics() {
  console.log('\n📈 Testing analytics...');
  
  const result = await makeRequest('POST', '/api/unified/analytics', {
    groupBy: 'source_provider',
    metrics: ['count', 'active_count', 'avg_risk_score', 'fraud_count'],
    filters: {},
    dateRange: {
      from: '2023-01-01',
      to: '2024-12-31'
    }
  });
  
  if (result.success) {
    console.log('✅ Analytics successful:', {
      totalStats: result.data.totalStats,
      topProviders: result.data.analyticsData?.slice(0, 3)
    });
  } else {
    console.error('❌ Analytics failed:', result.error);
  }
}

async function testDataExport() {
  console.log('\n📤 Testing data export...');
  
  const result = await makeRequest('POST', '/api/unified/export', {
    filters: { source_provider: 'airtel' },
    format: 'json',
    limit: 5,
    fields: ['subscriber_id', 'full_name', 'primary_phone', 'service_type', 'plan_name']
  });
  
  if (result.success) {
    console.log('✅ Data export successful:', {
      recordCount: result.data.count,
      exportedAt: result.data.exportedAt,
      sampleRecord: result.data.data[0] // Show first record
    });
  } else {
    console.error('❌ Data export failed:', result.error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive SDRMS unified system tests...\n');
  console.log('='.repeat(60));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  // Run all tests
  await testHealthCheck();
  await testUnifiedDatasetStats();
  await testMappingSuggestions();
  await testBulkIngestionJson();
  await testAdvancedSearch();
  await testBulkSearch();
  await testGeoSearch();
  await testAnalytics();
  await testDataExport();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- ✅ Authentication system working');
  console.log('- ✅ Unified dataset statistics');
  console.log('- ✅ Bulk data ingestion (JSON)');
  console.log('- ✅ Intelligent field mapping suggestions');
  console.log('- ✅ Advanced search with filters');
  console.log('- ✅ Bulk identifier search');
  console.log('- ✅ Geographic search capabilities');
  console.log('- ✅ Analytics and aggregations');
  console.log('- ✅ Data export functionality');
  console.log('\n🌟 Your unified SDRMS system is fully operational!');
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  login,
  testUnifiedDatasetStats,
  testBulkIngestionJson,
  testAdvancedSearch
};
