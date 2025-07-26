const express = require('express');
const { Client } = require('@opensearch-project/opensearch');
const UnifiedDataset = require('../models/UnifiedDataset');
const winston = require('winston');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'unified-search' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Initialize OpenSearch client
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200'
});

// Advanced search with multiple parameters
router.post('/advanced-search', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      sort = { field: 'ingestion_date', order: 'desc' },
      page = 1,
      limit = 20,
      useOpenSearch = true
    } = req.body;

    let results;
    let totalCount;

    if (useOpenSearch && process.env.OPENSEARCH_URL) {
      // Use OpenSearch for advanced full-text search
      try {
        const searchBody = {
          query: {
            bool: {
              must: [],
              filter: []
            }
          },
          sort: {},
          from: (page - 1) * limit,
          size: limit
        };

        // Add text query if provided
        if (query && query.trim()) {
          searchBody.query.bool.must.push({
            multi_match: {
              query: query,
              fields: ['full_name^2', 'primary_phone^2', 'email', 'address.city', 'plan_name'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          });
        }

        // Add filters
        Object.keys(filters).forEach(key => {
          if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
            if (Array.isArray(filters[key])) {
              // Array filters (multiple values)
              searchBody.query.bool.filter.push({
                terms: { [key]: filters[key] }
              });
            } else if (typeof filters[key] === 'object' && filters[key].from !== undefined) {
              // Range filters
              const rangeQuery = { range: { [key]: {} } };
              if (filters[key].from) rangeQuery.range[key].gte = filters[key].from;
              if (filters[key].to) rangeQuery.range[key].lte = filters[key].to;
              searchBody.query.bool.filter.push(rangeQuery);
            } else {
              // Exact match filters
              searchBody.query.bool.filter.push({
                term: { [key]: filters[key] }
              });
            }
          }
        });

        // Add sorting
        searchBody.sort[sort.field] = { order: sort.order };

        const searchResult = await opensearchClient.search({
          index: 'unified_datasets',
          body: searchBody
        });

        results = searchResult.body.hits.hits.map(hit => ({
          _id: hit._id,
          _score: hit._score,
          ...hit._source
        }));

        totalCount = searchResult.body.hits.total.value || searchResult.body.hits.total;

      } catch (opensearchError) {
        logger.warn('OpenSearch query failed, falling back to MongoDB:', opensearchError.message);
        // Fallback to MongoDB
        const fallbackResult = await searchWithMongoDB(query, filters, sort, page, limit);
        results = fallbackResult.results;
        totalCount = fallbackResult.totalCount;
      }
    } else {
      // Use MongoDB for search
      const mongoResult = await searchWithMongoDB(query, filters, sort, page, limit);
      results = mongoResult.results;
      totalCount = mongoResult.totalCount;
    }

    res.json({
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      searchEngine: useOpenSearch && process.env.OPENSEARCH_URL ? 'opensearch' : 'mongodb'
    });

  } catch (error) {
    logger.error('Advanced search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Helper function for MongoDB search
async function searchWithMongoDB(query, filters, sort, page, limit) {
  const mongoFilters = { ...filters };

  // Add text search if query provided
  if (query && query.trim()) {
    mongoFilters.$text = { $search: query };
  }

  // Convert date strings to Date objects for date filters
  Object.keys(mongoFilters).forEach(key => {
    if (key.includes('date') && typeof mongoFilters[key] === 'object' && !Array.isArray(mongoFilters[key])) {
      if (mongoFilters[key].from) mongoFilters[key].from = new Date(mongoFilters[key].from);
      if (mongoFilters[key].to) mongoFilters[key].to = new Date(mongoFilters[key].to);
      mongoFilters[key] = {
        $gte: mongoFilters[key].from,
        $lte: mongoFilters[key].to
      };
    }
  });

  const sortObj = {};
  sortObj[sort.field] = sort.order === 'desc' ? -1 : 1;

  const results = await UnifiedDataset.find(mongoFilters)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalCount = await UnifiedDataset.countDocuments(mongoFilters);

  return { results, totalCount };
}

// Bulk search with multiple phone numbers or IDs
router.post('/bulk-search', async (req, res) => {
  try {
    const { identifiers, identifierType = 'primary_phone', limit = 1000 } = req.body;

    if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
      return res.status(400).json({ message: 'Identifiers array is required' });
    }

    if (identifiers.length > limit) {
      return res.status(400).json({ 
        message: `Too many identifiers. Maximum allowed: ${limit}` 
      });
    }

    const results = await UnifiedDataset.find({
      [identifierType]: { $in: identifiers }
    }).lean();

    // Group results by identifier for easy lookup
    const resultMap = {};
    results.forEach(result => {
      const identifier = result[identifierType];
      if (!resultMap[identifier]) {
        resultMap[identifier] = [];
      }
      resultMap[identifier].push(result);
    });

    // Find missing identifiers
    const foundIdentifiers = Object.keys(resultMap);
    const missingIdentifiers = identifiers.filter(id => !foundIdentifiers.includes(id));

    res.json({
      results: resultMap,
      summary: {
        requested: identifiers.length,
        found: foundIdentifiers.length,
        missing: missingIdentifiers.length,
        totalRecords: results.length
      },
      missingIdentifiers: missingIdentifiers.slice(0, 100) // Limit to first 100
    });

  } catch (error) {
    logger.error('Bulk search error:', error);
    res.status(500).json({ message: 'Bulk search failed', error: error.message });
  }
});

// Search by geographic location
router.get('/geo-search', async (req, res) => {
  try {
    const { 
      city, 
      state, 
      country = 'India',
      radius,
      latitude,
      longitude,
      page = 1,
      limit = 20 
    } = req.query;

    const filters = {};

    if (city) filters['address.city'] = new RegExp(city, 'i');
    if (state) filters['address.state'] = new RegExp(state, 'i');
    if (country) filters['address.country'] = country;

    // If coordinates and radius provided, search within radius
    if (latitude && longitude && radius) {
      filters['address.latitude'] = {
        $gte: parseFloat(latitude) - parseFloat(radius),
        $lte: parseFloat(latitude) + parseFloat(radius)
      };
      filters['address.longitude'] = {
        $gte: parseFloat(longitude) - parseFloat(radius),
        $lte: parseFloat(longitude) + parseFloat(radius)
      };
    }

    const results = await UnifiedDataset.find(filters)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await UnifiedDataset.countDocuments(filters);

    // Get location statistics
    const locationStats = await UnifiedDataset.aggregate([
      { $match: filters },
      {
        $group: {
          _id: { city: '$address.city', state: '$address.state' },
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      },
      locationStats
    });

  } catch (error) {
    logger.error('Geo search error:', error);
    res.status(500).json({ message: 'Geographic search failed', error: error.message });
  }
});

// Advanced analytics and aggregations
router.post('/analytics', async (req, res) => {
  try {
    const { 
      groupBy = 'source_provider',
      metrics = ['count', 'active_count'],
      filters = {},
      dateRange 
    } = req.body;

    // Build match stage
    const matchStage = { ...filters };
    if (dateRange) {
      matchStage.ingestion_date = {
        $gte: new Date(dateRange.from),
        $lte: new Date(dateRange.to)
      };
    }

    // Build group stage
    const groupStage = {
      _id: `$${groupBy}`,
      count: { $sum: 1 }
    };

    // Add requested metrics
    if (metrics.includes('active_count')) {
      groupStage.activeCount = {
        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
      };
    }
    if (metrics.includes('avg_risk_score')) {
      groupStage.avgRiskScore = { $avg: '$risk_score' };
    }
    if (metrics.includes('fraud_count')) {
      groupStage.fraudCount = {
        $sum: { $cond: ['$is_fraud_flagged', 1, 0] }
      };
    }
    if (metrics.includes('avg_balance')) {
      groupStage.avgBalance = { $avg: '$account_balance' };
    }

    const pipeline = [
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ];

    const analyticsData = await UnifiedDataset.aggregate(pipeline);

    // Get overall totals
    const totalStats = await UnifiedDataset.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          activeRecords: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          avgRiskScore: { $avg: '$risk_score' },
          fraudCount: {
            $sum: { $cond: ['$is_fraud_flagged', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      analyticsData,
      totalStats: totalStats[0] || {},
      groupBy,
      metrics,
      appliedFilters: matchStage
    });

  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ message: 'Analytics query failed', error: error.message });
  }
});

// Export data with filters
router.post('/export', async (req, res) => {
  try {
    const { 
      filters = {}, 
      format = 'json',
      limit = 10000,
      fields = []
    } = req.body;

    if (limit > 50000) {
      return res.status(400).json({ 
        message: 'Export limit cannot exceed 50,000 records' 
      });
    }

    let query = UnifiedDataset.find(filters).limit(limit);
    
    // Select specific fields if provided
    if (fields.length > 0) {
      const fieldSelection = fields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {});
      query = query.select(fieldSelection);
    }

    const results = await query.lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = fields.length > 0 ? fields : Object.keys(results[0] || {});
      const csvRows = results.map(record => 
        csvHeaders.map(header => record[header] || '').join(',')
      );
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
      res.send(csv);
    } else {
      res.json({
        data: results,
        count: results.length,
        exportedAt: new Date().toISOString(),
        filters
      });
    }

  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

module.exports = router;
