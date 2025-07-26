const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { Client } = require('@opensearch-project/opensearch');
const { requirePermission } = require('../middleware/auth');
const { searchRateLimit } = require('../middleware/rateLimiter');

// Initialize OpenSearch client
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin'
  },
  ssl: {
    rejectUnauthorized: false // For development only
  }
});

// Test OpenSearch connection
const testOpenSearchConnection = async () => {
  try {
    const response = await opensearchClient.ping();
    console.log('✅ OpenSearch connection successful');
    return true;
  } catch (error) {
    console.warn('⚠️ OpenSearch not available, falling back to MongoDB search');
    return false;
  }
};

// Global search endpoint
router.get('/', requirePermission('read_subscribers'), searchRateLimit, async (req, res) => {
  try {
    const { 
      q: query, 
      page = 1, 
      limit = 50, 
      type = 'all',
      district,
      operator,
      status,
      suspicious
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search term'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 results per page
    const skip = (pageNum - 1) * limitNum;

    // Try OpenSearch first, fallback to MongoDB
    const isOpenSearchAvailable = await testOpenSearchConnection();
    
    let results, total;

    if (isOpenSearchAvailable) {
      // OpenSearch query
      const searchBody = {
        from: skip,
        size: limitNum,
        query: {
          bool: {
            must: {
              multi_match: {
                query: query,
                fields: [
                  'subscriberName^3',
                  'mobileNumber^2',
                  'address.city^2',
                  'address.district^2',
                  'simDetails.simId',
                  'deviceInfo.imei',
                  'fatherName'
                ],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            filter: []
          }
        },
        highlight: {
          fields: {
            subscriberName: {},
            mobileNumber: {},
            'address.city': {},
            'address.district': {}
          }
        },
        sort: [
          { '_score': { order: 'desc' } },
          { 'createdAt': { order: 'desc' } }
        ]
      };

      // Add filters
      if (district) {
        searchBody.query.bool.filter.push({
          term: { 'address.district.keyword': district }
        });
      }

      if (operator) {
        searchBody.query.bool.filter.push({
          term: { 'operatorDetails.operatorName.keyword': operator }
        });
      }

      if (status) {
        searchBody.query.bool.filter.push({
          term: { 'simDetails.status.keyword': status }
        });
      }

      if (suspicious === 'true') {
        searchBody.query.bool.filter.push({
          term: { 'fraudFlags.isSuspicious': true }
        });
      }

      const opensearchResponse = await opensearchClient.search({
        index: 'subscribers',
        body: searchBody
      });

      results = opensearchResponse.body.hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score,
        _highlights: hit.highlight
      }));

      total = opensearchResponse.body.hits.total.value;

    } else {
      // MongoDB fallback search
      const searchOptions = {
        limit: limitNum,
        skip: skip,
        sort: { createdAt: -1 }
      };

      // Build MongoDB query
      let mongoQuery = {
        $or: [
          { subscriberName: { $regex: query, $options: 'i' } },
          { mobileNumber: { $regex: query, $options: 'i' } },
          { 'address.city': { $regex: query, $options: 'i' } },
          { 'address.district': { $regex: query, $options: 'i' } },
          { 'simDetails.simId': { $regex: query, $options: 'i' } },
          { 'deviceInfo.imei': { $regex: query, $options: 'i' } }
        ]
      };

      // Add filters to MongoDB query
      if (district) {
        mongoQuery['address.district'] = { $regex: new RegExp(district, 'i') };
      }

      if (operator) {
        mongoQuery['operatorDetails.operatorName'] = { $regex: new RegExp(operator, 'i') };
      }

      if (status) {
        mongoQuery['simDetails.status'] = status;
      }

      if (suspicious === 'true') {
        mongoQuery['fraudFlags.isSuspicious'] = true;
      }

      results = await Subscriber.find(mongoQuery)
        .limit(limitNum)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      total = await Subscriber.countDocuments(mongoQuery);
    }

    // Log search activity
    console.log(`Search performed by ${req.user.username}: "${query}" - ${results.length} results`);

    res.json({
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: skip + limitNum < total,
        hasPrev: pageNum > 1
      },
      search: {
        query,
        type,
        filters: { district, operator, status, suspicious },
        engine: isOpenSearchAvailable ? 'opensearch' : 'mongodb'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching subscribers'
    });
  }
});

// Search by mobile number (exact match)
router.get('/mobile/:number', requirePermission('read_subscribers'), searchRateLimit, async (req, res) => {
  try {
    const { number } = req.params;
    
    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(number)) {
      return res.status(400).json({
        error: 'Invalid mobile number format',
        message: 'Mobile number should be 10 digits starting with 6-9'
      });
    }

    const subscriber = await Subscriber.findOne({ mobileNumber: number }).lean();
    
    if (!subscriber) {
      return res.status(404).json({
        error: 'Subscriber not found',
        message: `No subscriber found with mobile number ${number}`
      });
    }

    res.json({
      subscriber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mobile search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching by mobile number'
    });
  }
});

// Search by SIM ID
router.get('/sim/:simId', requirePermission('read_subscribers'), searchRateLimit, async (req, res) => {
  try {
    const { simId } = req.params;
    
    const subscriber = await Subscriber.findOne({ 'simDetails.simId': simId }).lean();
    
    if (!subscriber) {
      return res.status(404).json({
        error: 'Subscriber not found',
        message: `No subscriber found with SIM ID ${simId}`
      });
    }

    res.json({
      subscriber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SIM search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching by SIM ID'
    });
  }
});

// Advanced search with multiple criteria
router.post('/advanced', requirePermission('read_subscribers'), searchRateLimit, async (req, res) => {
  try {
    const {
      name,
      mobile,
      address,
      district,
      operator,
      simId,
      imei,
      status,
      dateRange,
      suspicious
    } = req.body;

    const query = {};
    
    if (name) {
      query.$or = [
        { subscriberName: { $regex: name, $options: 'i' } },
        { fatherName: { $regex: name, $options: 'i' } }
      ];
    }

    if (mobile) {
      query.mobileNumber = { $regex: mobile, $options: 'i' };
    }

    if (address) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'address.street': { $regex: address, $options: 'i' } },
        { 'address.city': { $regex: address, $options: 'i' } },
        { 'address.district': { $regex: address, $options: 'i' } }
      );
    }

    if (district) {
      query['address.district'] = { $regex: district, $options: 'i' };
    }

    if (operator) {
      query['operatorDetails.operatorName'] = { $regex: operator, $options: 'i' };
    }

    if (simId) {
      query['simDetails.simId'] = { $regex: simId, $options: 'i' };
    }

    if (imei) {
      query['deviceInfo.imei'] = { $regex: imei, $options: 'i' };
    }

    if (status) {
      query['simDetails.status'] = status;
    }

    if (suspicious !== undefined) {
      query['fraudFlags.isSuspicious'] = suspicious;
    }

    if (dateRange && dateRange.from && dateRange.to) {
      query.createdAt = {
        $gte: new Date(dateRange.from),
        $lte: new Date(dateRange.to)
      };
    }

    const results = await Subscriber.find(query)
      .limit(100)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Subscriber.countDocuments(query);

    res.json({
      results,
      total,
      query: req.body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      error: 'Advanced search failed',
      message: 'An error occurred while performing advanced search'
    });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', requirePermission('read_subscribers'), searchRateLimit, async (req, res) => {
  try {
    const { q: query, type = 'name' } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    switch (type) {
      case 'name':
        suggestions = await Subscriber.distinct('subscriberName', {
          subscriberName: { $regex: `^${query}`, $options: 'i' }
        }).limit(10);
        break;
        
      case 'district':
        suggestions = await Subscriber.distinct('address.district', {
          'address.district': { $regex: `^${query}`, $options: 'i' }
        }).limit(10);
        break;
        
      case 'operator':
        suggestions = await Subscriber.distinct('operatorDetails.operatorName', {
          'operatorDetails.operatorName': { $regex: `^${query}`, $options: 'i' }
        }).limit(10);
        break;
        
      default:
        suggestions = [];
    }

    res.json({
      suggestions: suggestions.filter(Boolean),
      type,
      query
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: 'Suggestions failed',
      suggestions: []
    });
  }
});

module.exports = router;
