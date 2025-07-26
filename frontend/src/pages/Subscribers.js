import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { searchAPI, subscribersAPI } from '../services/api';
import { toast } from 'react-toastify';

function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'default';
      case 'Suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      field: 'msisdn',
      headerName: 'MSISDN',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'imsi',
      headerName: 'IMSI',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      editable: true
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'plan',
      headerName: 'Plan',
      width: 100
    },
    {
      field: 'dataUsage',
      headerName: 'Data (GB)',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value.toFixed(1)}
        </Typography>
      )
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 120
    },
    {
      field: 'lastActivity',
      headerName: 'Last Activity',
      width: 130,
      type: 'date',
      valueGetter: (params) => new Date(params.value)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch = 
      subscriber.name.toLowerCase().includes(searchText.toLowerCase()) ||
      subscriber.msisdn.includes(searchText) ||
      subscriber.imsi.includes(searchText);
    
    const matchesStatus = statusFilter === 'All' || subscriber.status === statusFilter;
    const matchesPlan = planFilter === 'All' || subscriber.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleEdit = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      setSubscribers(subscribers.filter(sub => sub.id !== id));
    }
  };

  const handleAdd = () => {
    setSelectedSubscriber({
      msisdn: '',
      imsi: '',
      name: '',
      status: 'Active',
      plan: 'Basic',
      joinDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      dataUsage: 0,
      location: ''
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (editMode) {
      setSubscribers(subscribers.map(sub => 
        sub.id === selectedSubscriber.id ? selectedSubscriber : sub
      ));
    } else {
      const newSubscriber = {
        ...selectedSubscriber,
        id: Math.max(...subscribers.map(s => s.id)) + 1
      };
      setSubscribers([...subscribers, newSubscriber]);
    }
    setOpenDialog(false);
    setSelectedSubscriber(null);
  };

  // Load subscribers data from API
  const loadSubscribers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await searchAPI.unified({ page: 1, limit: 100 });
      
      if (response.data.success) {
        const formattedData = response.data.results.map((sub, index) => ({
          id: sub._id || index + 1,
          msisdn: sub.msisdn || 'N/A',
          imsi: sub.imsi || 'N/A',
          name: sub.subscriber_name || sub.name || 'Unknown',
          status: sub.status || 'Active',
          plan: sub.plan_type || sub.plan || 'Basic',
          joinDate: sub.activation_date || sub.created_at || new Date().toISOString().split('T')[0],
          lastActivity: sub.last_activity || sub.updated_at || new Date().toISOString().split('T')[0],
          dataUsage: parseFloat(sub.data_usage_gb || sub.data_usage || Math.random() * 5),
          location: sub.location || sub.city || 'Unknown'
        }));
        
        setSubscribers(formattedData);
        toast.success(`Loaded ${formattedData.length} subscribers`);
      } else {
        setError('Failed to load subscribers');
        toast.error('Failed to load subscribers');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error fetching subscribers';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSubscribers();
  };

  // Load data on component mount
  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "MSISDN,IMSI,Name,Status,Plan,Data Usage,Location,Last Activity\n" +
      filteredSubscribers.map(sub => 
        `${sub.msisdn},${sub.imsi},${sub.name},${sub.status},${sub.plan},${sub.dataUsage},${sub.location},${sub.lastActivity}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Subscribers Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, MSISDN, or IMSI..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                label="Plan"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Standard">Standard</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Add Subscriber
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredSubscribers}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Subscriber' : 'Add New Subscriber'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MSISDN"
                value={selectedSubscriber?.msisdn || ''}
                onChange={(e) => setSelectedSubscriber({
                  ...selectedSubscriber,
                  msisdn: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IMSI"
                value={selectedSubscriber?.imsi || ''}
                onChange={(e) => setSelectedSubscriber({
                  ...selectedSubscriber,
                  imsi: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={selectedSubscriber?.name || ''}
                onChange={(e) => setSelectedSubscriber({
                  ...selectedSubscriber,
                  name: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={selectedSubscriber?.location || ''}
                onChange={(e) => setSelectedSubscriber({
                  ...selectedSubscriber,
                  location: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedSubscriber?.status || 'Active'}
                  onChange={(e) => setSelectedSubscriber({
                    ...selectedSubscriber,
                    status: e.target.value
                  })}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={selectedSubscriber?.plan || 'Basic'}
                  onChange={(e) => setSelectedSubscriber({
                    ...selectedSubscriber,
                    plan: e.target.value
                  })}
                  label="Plan"
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Subscribers;
