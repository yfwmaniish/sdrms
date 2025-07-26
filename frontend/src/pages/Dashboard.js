import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function Dashboard() {
  // Mock data for demo
  const statsData = [
    {
      title: 'Total Subscribers',
      value: '1,234,567',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      change: '+5.2%',
      loading: false
    },
    {
      title: 'Active Connections',
      value: '987,432',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      change: '+3.1%',
      loading: false
    },
    {
      title: 'Flagged Records',
      value: '1,234',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      change: '-2.3%',
      loading: false
    },
    {
      title: 'Data Processed',
      value: '45.6 GB',
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      change: '+12.4%',
      loading: false
    }
  ];

  const [subscriberTrend, setSubscriberTrend] = useState([
    { name: 'Jan', subscribers: 2400000, active: 1800000 },
    { name: 'Feb', subscribers: 2500000, active: 1850000 },
    { name: 'Mar', subscribers: 2600000, active: 1900000 },
    { name: 'Apr', subscribers: 2700000, active: 1920000 },
    { name: 'May', subscribers: 2750000, active: 1920000 },
    { name: 'Jun', subscribers: 2847392, active: 1923847 }
  ]);

  const [networkUsage, setNetworkUsage] = useState([
    { name: '00:00', usage: 65 },
    { name: '04:00', usage: 42 },
    { name: '08:00', usage: 88 },
    { name: '12:00', usage: 95 },
    { name: '16:00', usage: 78 },
    { name: '20:00', usage: 86 },
    { name: '24:00', usage: 72 }
  ]);

  const [dataDistribution, setDataDistribution] = useState([
    { name: 'Voice Calls', value: 35, color: '#1976d2' },
    { name: 'SMS', value: 25, color: '#2e7d32' },
    { name: 'Data Usage', value: 30, color: '#ed6c02' },
    { name: 'Roaming', value: 10, color: '#9c27b0' }
  ]);

  const [realtimeMetrics, setRealtimeMetrics] = useState({
    activeUsers: 1923847,
    dataTransfer: 2.4, // GB/s
    systemLoad: 67,
    errorRate: 0.02
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Update real-time metrics
      setRealtimeMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 100 - 50),
        dataTransfer: Math.max(0.1, prev.dataTransfer + (Math.random() - 0.5) * 0.5),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.random() * 10 - 5)),
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.01)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Import the API service at the top of the file
      const { searchAPI } = await import('../services/api');
      
      // Get unified search stats
      const response = await searchAPI.unified({ page: 1, limit: 1 });
      console.log('Dashboard data:', response.data);
      
      if (response.data.success) {
        const { total, stats } = response.data;
        
        // Update the mock data with real stats
        setRealtimeMetrics(prev => ({
          ...prev,
          activeUsers: stats?.active || prev.activeUsers,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              className="card-hover"
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color}10 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}20`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.change.startsWith('+') ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ color: stat.color, opacity: 0.7 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Real-time Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {realtimeMetrics.activeUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {realtimeMetrics.dataTransfer.toFixed(1)} GB/s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data Transfer
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {realtimeMetrics.systemLoad.toFixed(0)}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    System Load
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={realtimeMetrics.systemLoad} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: realtimeMetrics.errorRate > 1 ? '#f44336' : '#4caf50' }}>
                    {realtimeMetrics.errorRate.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Error Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subscriber Growth Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={subscriberTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value.toLocaleString(), '']} />
                <Legend />
                <Area type="monotone" dataKey="subscribers" stackId="1" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} name="Total Subscribers" />
                <Area type="monotone" dataKey="active" stackId="2" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} name="Active Subscribers" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Usage (24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={networkUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                <Line type="monotone" dataKey="usage" stroke="#ed6c02" strokeWidth={3} dot={{ fill: '#ed6c02' }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
