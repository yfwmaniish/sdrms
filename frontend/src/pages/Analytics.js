import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh,
  Download,
  DateRange
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
  Cell,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sample analytics data
  const [subscriberGrowth, setSubscriberGrowth] = useState([
    { date: '2024-01-01', total: 2400000, active: 1800000, new: 12000, churn: 8000 },
    { date: '2024-01-02', total: 2415000, active: 1810000, new: 18000, churn: 3000 },
    { date: '2024-01-03', total: 2428000, active: 1825000, new: 15000, churn: 2000 },
    { date: '2024-01-04', total: 2445000, active: 1840000, new: 20000, churn: 3000 },
    { date: '2024-01-05', total: 2460000, active: 1855000, new: 17000, churn: 2000 },
    { date: '2024-01-06', total: 2478000, active: 1870000, new: 22000, churn: 4000 },
    { date: '2024-01-07', total: 2495000, active: 1885000, new: 19000, churn: 2000 }
  ]);

  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', revenue: 12500000, costs: 8200000, profit: 4300000 },
    { month: 'Feb', revenue: 13200000, costs: 8500000, profit: 4700000 },
    { month: 'Mar', revenue: 14100000, costs: 8800000, profit: 5300000 },
    { month: 'Apr', revenue: 13800000, costs: 9100000, profit: 4700000 },
    { month: 'May', revenue: 15200000, costs: 9400000, profit: 5800000 },
    { month: 'Jun', revenue: 16100000, costs: 9700000, profit: 6400000 }
  ]);

  const [networkUsage, setNetworkUsage] = useState([
    { time: '00:00', voice: 65, sms: 45, data: 88 },
    { time: '04:00', voice: 42, sms: 32, data: 65 },
    { time: '08:00', voice: 88, sms: 78, data: 95 },
    { time: '12:00', voice: 95, sms: 85, data: 98 },
    { time: '16:00', voice: 78, sms: 68, data: 92 },
    { time: '20:00', voice: 86, sms: 75, data: 89 },
    { time: '24:00', voice: 72, sms: 58, data: 78 }
  ]);

  const [planDistribution, setPlanDistribution] = useState([
    { name: 'Basic', value: 35, revenue: 4200000, color: '#8884d8' },
    { name: 'Standard', value: 40, revenue: 6800000, color: '#82ca9d' },
    { name: 'Premium', value: 20, revenue: 7200000, color: '#ffc658' },
    { name: 'Enterprise', value: 5, revenue: 2800000, color: '#ff7300' }
  ]);

  const [topPerformers, setTopPerformers] = useState([
    { region: 'North America', subscribers: 890000, revenue: 12500000, growth: 5.2 },
    { region: 'Europe', subscribers: 750000, revenue: 11200000, growth: 3.8 },
    { region: 'Asia Pacific', subscribers: 620000, revenue: 8900000, growth: 7.1 },
    { region: 'Latin America', subscribers: 235000, revenue: 3400000, growth: 2.9 }
  ]);

  const [kpiData, setKpiData] = useState({
    totalRevenue: 16100000,
    totalSubscribers: 2495000,
    arpu: 64.50, // Average Revenue Per User
    churnRate: 2.1,
    customerSatisfaction: 4.2,
    networkUptime: 99.8
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setKpiData(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 10000 - 5000),
        totalSubscribers: prev.totalSubscribers + Math.floor(Math.random() * 100 - 50),
        arpu: Math.max(50, prev.arpu + (Math.random() - 0.5) * 2),
        churnRate: Math.max(0, Math.min(5, prev.churnRate + (Math.random() - 0.5) * 0.2)),
        customerSatisfaction: Math.max(1, Math.min(5, prev.customerSatisfaction + (Math.random() - 0.5) * 0.1)),
        networkUptime: Math.max(95, Math.min(100, prev.networkUptime + (Math.random() - 0.5) * 0.1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real app, fetch fresh data from API
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // In real app, generate and download analytics report
    console.log('Exporting analytics report...');
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Analytics & Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
              />
            }
            label="Real-time"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment sx={{ mr: 1 }} />
                <Typography variant="body2">Total Revenue</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(kpiData.totalRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">+12.5%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" gutterBottom>Subscribers</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatNumber(kpiData.totalSubscribers)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">+5.2%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" gutterBottom>ARPU</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(kpiData.arpu)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">+3.1%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" gutterBottom>Churn Rate</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {kpiData.churnRate.toFixed(1)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">-0.8%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#333' }}>
            <CardContent>
              <Typography variant="body2" gutterBottom>Satisfaction</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {kpiData.customerSatisfaction.toFixed(1)}/5.0
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">+0.2</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', color: '#333' }}>
            <CardContent>
              <Typography variant="body2" gutterBottom>Uptime</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {kpiData.networkUptime.toFixed(1)}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">+0.1%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Subscriber Analytics" />
          <Tab label="Revenue Analytics" />
          <Tab label="Network Usage" />
          <Tab label="Performance" />
        </Tabs>

        {/* Subscriber Analytics Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Subscriber Growth Trend
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={subscriberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                    <Legend />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Total Subscribers" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Active Subscribers" />
                    <Bar dataKey="new" fill="#ffc658" name="New Subscribers" />
                    <Line type="monotone" dataKey="churn" stroke="#ff7300" strokeWidth={3} name="Churn" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Plan Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Plan Revenue
                </Typography>
                {planDistribution.map((plan, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{plan.name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(plan.revenue)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Revenue Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue vs Costs
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="costs" fill="#82ca9d" name="Costs" />
                    <Bar dataKey="profit" fill="#ffc658" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Regional Performance
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Region</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Growth</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topPerformers.map((region) => (
                        <TableRow key={region.region}>
                          <TableCell component="th" scope="row">
                            {region.region}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(region.revenue)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${region.growth}%`}
                              size="small"
                              color={region.growth > 0 ? 'success' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Network Usage Tab */}
        <TabPanel value={activeTab} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Network Usage by Service Type (24 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={networkUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Line type="monotone" dataKey="voice" stroke="#8884d8" strokeWidth={3} name="Voice" />
                <Line type="monotone" dataKey="sms" stroke="#82ca9d" strokeWidth={3} name="SMS" />
                <Line type="monotone" dataKey="data" stroke="#ffc658" strokeWidth={3} name="Data" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  System Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { label: 'CPU Usage', value: 67, color: '#8884d8' },
                    { label: 'Memory Usage', value: 54, color: '#82ca9d' },
                    { label: 'Disk Usage', value: 78, color: '#ffc658' },
                    { label: 'Network I/O', value: 43, color: '#ff7300' }
                  ].map((metric, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{metric.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {metric.value}%
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                        <Box
                          sx={{
                            width: `${metric.value}%`,
                            bgcolor: metric.color,
                            height: 8,
                            borderRadius: 1
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Response Times (ms)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={[
                    { name: 'API Gateway', value: 45, fill: '#8884d8' },
                    { name: 'Database', value: 23, fill: '#82ca9d' },
                    { name: 'Search Engine', value: 12, fill: '#ffc658' },
                    { name: 'Cache', value: 8, fill: '#ff7300' }
                  ]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default Analytics;
