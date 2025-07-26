const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const { requirePermission } = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/rateLimiter');

// Dashboard overview statistics
router.get('/dashboard', requirePermission('view_analytics'), generalRateLimit, async (req, res) => {
  try {
    const [
      totalSubscribers,
      activeSubscribers,
      suspiciousSubscribers,
      recentSubscribers,
      operatorStats,
      districtStats,
      statusStats
    ] = await Promise.all([
      // Total subscribers count
      Subscriber.countDocuments(),
      
      // Active subscribers count
      Subscriber.countDocuments({ 'simDetails.status': 'Active' }),
      
      // Suspicious subscribers count
      Subscriber.countDocuments({ 'fraudFlags.isSuspicious': true }),
      
      // Recent subscribers (last 30 days)
      Subscriber.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // Subscribers by operator
      Subscriber.aggregate([
        {
          $group: {
            _id: '$operatorDetails.operatorName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Subscribers by district
      Subscriber.aggregate([
        {
          $group: {
            _id: '$address.district',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Subscribers by status
      Subscriber.aggregate([
        {
          $group: {
            _id: '$simDetails.status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      overview: {
        totalSubscribers,
        activeSubscribers,
        suspiciousSubscribers,
        recentSubscribers,
        inactiveSubscribers: totalSubscribers - activeSubscribers
      },
      charts: {
        operatorDistribution: operatorStats.map(item => ({
          name: item._id || 'Unknown',
          value: item.count
        })),
        districtDistribution: districtStats.map(item => ({
          name: item._id || 'Unknown',
          value: item.count
        })),
        statusDistribution: statusStats.map(item => ({
          name: item._id || 'Unknown',
          value: item.count
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while fetching dashboard analytics'
    });
  }
});

// Growth trends over time
router.get('/trends', requirePermission('view_analytics'), generalRateLimit, async (req, res) => {
  try {
    const { period = 'monthly', limit = 12 } = req.query;
    
    let groupBy;
    let dateFormat;
    
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        dateFormat = '%Y-W%U';
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        dateFormat = '%Y-%m';
        break;
    }

    const trends = await Subscriber.aggregate([
      {
        $group: {
          _id: groupBy,
          totalSubscribers: { $sum: 1 },
          activeSubscribers: {
            $sum: {
              $cond: [{ $eq: ['$simDetails.status', 'Active'] }, 1, 0]
            }
          },
          suspiciousSubscribers: {
            $sum: {
              $cond: ['$fraudFlags.isSuspicious', 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      trends: trends.reverse(),
      period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      error: 'Trends analytics failed',
      message: 'An error occurred while fetching trend analytics'
    });
  }
});

// Fraud detection analytics
router.get('/fraud', requirePermission('view_analytics'), generalRateLimit, async (req, res) => {
  try {
    const [
      fraudStats,
      fraudReasons,
      recentFraudFlags,
      fraudTrends
    ] = await Promise.all([
      // Overall fraud statistics
      Subscriber.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            suspicious: {
              $sum: { $cond: ['$fraudFlags.isSuspicious', 1, 0] }
            },
            verified: {
              $sum: { $cond: ['$fraudFlags.isVerified', 1, 0] }
            }
          }
        }
      ]),
      
      // Fraud reasons breakdown
      Subscriber.aggregate([
        { $match: { 'fraudFlags.isSuspicious': true } },
        { $unwind: '$fraudFlags.suspiciousReasons' },
        {
          $group: {
            _id: '$fraudFlags.suspiciousReasons',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Recent fraud flags (last 7 days)
      Subscriber.find({
        'fraudFlags.isSuspicious': true,
        'fraudFlags.flaggedDate': { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      })
      .select('subscriberName mobileNumber fraudFlags.flaggedDate fraudFlags.suspiciousReasons')
      .sort({ 'fraudFlags.flaggedDate': -1 })
      .limit(10)
      .lean(),
      
      // Fraud trends over last 30 days
      Subscriber.aggregate([
        {
          $match: {
            'fraudFlags.flaggedDate': { 
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$fraudFlags.flaggedDate' },
              month: { $month: '$fraudFlags.flaggedDate' },
              day: { $dayOfMonth: '$fraudFlags.flaggedDate' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    const stats = fraudStats[0] || { total: 0, suspicious: 0, verified: 0 };

    res.json({
      overview: {
        totalSubscribers: stats.total,
        suspiciousCount: stats.suspicious,
        verifiedFraud: stats.verified,
        fraudRate: stats.total > 0 ? ((stats.suspicious / stats.total) * 100).toFixed(2) : 0
      },
      reasonsBreakdown: fraudReasons.map(item => ({
        reason: item._id,
        count: item.count
      })),
      recentFlags: recentFraudFlags,
      trends: fraudTrends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fraud analytics error:', error);
    res.status(500).json({
      error: 'Fraud analytics failed',
      message: 'An error occurred while fetching fraud analytics'
    });
  }
});

// Geographic distribution analytics
router.get('/geography', requirePermission('view_analytics'), generalRateLimit, async (req, res) => {
  try {
    const [districtStats, cityStats] = await Promise.all([
      // Subscribers by district
      Subscriber.aggregate([
        {
          $group: {
            _id: '$address.district',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$simDetails.status', 'Active'] }, 1, 0] }
            },
            suspicious: {
              $sum: { $cond: ['$fraudFlags.isSuspicious', 1, 0] }
            }
          }
        },
        { $sort: { total: -1 } }
      ]),
      
      // Top cities
      Subscriber.aggregate([
        {
          $group: {
            _id: {
              city: '$address.city',
              district: '$address.district'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    res.json({
      districts: districtStats.map(item => ({
        name: item._id || 'Unknown',
        total: item.total,
        active: item.active,
        suspicious: item.suspicious,
        activeRate: item.total > 0 ? ((item.active / item.total) * 100).toFixed(2) : 0,
        fraudRate: item.total > 0 ? ((item.suspicious / item.total) * 100).toFixed(2) : 0
      })),
      topCities: cityStats.map(item => ({
        city: item._id.city || 'Unknown',
        district: item._id.district || 'Unknown',
        count: item.count
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Geography analytics error:', error);
    res.status(500).json({
      error: 'Geography analytics failed',
      message: 'An error occurred while fetching geography analytics'
    });
  }
});

// System usage analytics (Admin only)
router.get('/system', requirePermission('manage_users'), generalRateLimit, async (req, res) => {
  try {
    const [
      userStats,
      recentLogins,
      topUsers
    ] = await Promise.all([
      // User statistics by role
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent login activities
      User.find({ lastLogin: { $exists: true } })
        .select('fullName username lastLogin role')
        .sort({ lastLogin: -1 })
        .limit(10)
        .lean(),
      
      // Most active users (by audit log entries)
      User.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            fullName: 1,
            username: 1,
            role: 1,
            activityCount: { $size: '$auditLog' }
          }
        },
        { $sort: { activityCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      usersByRole: userStats.map(item => ({
        role: item._id,
        count: item.count
      })),
      recentLogins,
      mostActiveUsers: topUsers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('System analytics error:', error);
    res.status(500).json({
      error: 'System analytics failed',
      message: 'An error occurred while fetching system analytics'
    });
  }
});

// Export analytics data
router.get('/export', requirePermission('export_data'), generalRateLimit, async (req, res) => {
  try {
    const { type = 'overview', format = 'json' } = req.query;
    
    let data;
    
    switch (type) {
      case 'fraud':
        data = await Subscriber.find({ 'fraudFlags.isSuspicious': true })
          .select('subscriberName mobileNumber address fraudFlags')
          .lean();
        break;
      case 'district':
        data = await Subscriber.aggregate([
          {
            $group: {
              _id: '$address.district',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);
        break;
      default:
        data = await Subscriber.countDocuments();
    }

    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.csv"`);
      // CSV conversion logic would go here
      res.send('CSV export not implemented yet');
    } else {
      res.json({
        type,
        data,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'An error occurred while exporting analytics data'
    });
  }
});

module.exports = router;
