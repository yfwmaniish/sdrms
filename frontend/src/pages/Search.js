import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    plan: 'All',
    location: 'All',
    dateRange: 'All'
  });
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([
    'John Doe',
    '+1234567890',
    'Premium subscribers',
    'Active users in New York'
  ]);

  // Mock search data
  const mockSearchResults = [
    {
      id: 1,
      type: 'subscriber',
      msisdn: '+1234567890',
      imsi: '123456789012345',
      name: 'John Doe',
      status: 'Active',
      plan: 'Premium',
      location: 'New York',
      lastActivity: '2024-01-25',
      score: 0.95
    },
    {
      id: 2,
      type: 'subscriber',
      msisdn: '+1234567891',
      imsi: '123456789012346',
      name: 'Jane Smith',
      status: 'Active',
      plan: 'Basic',
      location: 'California',
      lastActivity: '2024-01-24',
      score: 0.87
    },
    {
      id: 3,
      type: 'call_record',
      msisdn: '+1234567892',
      callType: 'Voice',
      duration: 320,
      timestamp: '2024-01-25 14:30:00',
      location: 'Texas',
      score: 0.75
    },
    {
      id: 4,
      type: 'data_usage',
      msisdn: '+1234567893',
      dataVolume: 2.5,
      timestamp: '2024-01-25 15:45:00',
      location: 'Florida',
      score: 0.68
    }
  ];

  const locationOptions = ['All', 'New York', 'California', 'Texas', 'Florida', 'Illinois'];
  const statusOptions = ['All', 'Active', 'Inactive', 'Suspended'];
  const planOptions = ['All', 'Basic', 'Standard', 'Premium'];

  useEffect(() => {
    if (searchQuery.length > 2) {
      // Simulate search suggestions
      const mockSuggestions = [
        `${searchQuery} - Subscriber`,
        `${searchQuery} - Phone Number`,
        `${searchQuery} - Location`,
        `${searchQuery} - Plan Type`
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // This would normally call your OpenSearch API
      // const response = await axios.post('/api/search', {
      //   query: searchQuery,
      //   filters: filters
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock results based on search query
      const filteredResults = mockSearchResults.filter(result => {
        const queryLower = searchQuery.toLowerCase();
        return (
          result.name?.toLowerCase().includes(queryLower) ||
          result.msisdn?.includes(searchQuery) ||
          result.imsi?.includes(searchQuery) ||
          result.location?.toLowerCase().includes(queryLower)
        );
      });
      
      setSearchResults(filteredResults);
      
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
        return updated;
      });
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'All',
      plan: 'All',
      location: 'All',
      dateRange: 'All'
    });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'subscriber':
        return <PersonIcon />;
      case 'call_record':
        return <PhoneIcon />;
      case 'data_usage':
        return <LocationIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getResultTitle = (result) => {
    switch (result.type) {
      case 'subscriber':
        return result.name || result.msisdn;
      case 'call_record':
        return `${result.callType} Call - ${result.duration}s`;
      case 'data_usage':
        return `Data Usage - ${result.dataVolume} GB`;
      default:
        return 'Unknown';
    }
  };

  const getResultSubtitle = (result) => {
    switch (result.type) {
      case 'subscriber':
        return `${result.msisdn} • ${result.status} • ${result.plan}`;
      case 'call_record':
        return `${result.msisdn} • ${result.timestamp}`;
      case 'data_usage':
        return `${result.msisdn} • ${result.timestamp}`;
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Advanced Search
      </Typography>
      
      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              freeSolo
              options={suggestions}
              inputValue={searchQuery}
              onInputChange={(event, newValue) => setSearchQuery(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  placeholder="Search by name, MSISDN, IMSI, location, or any keyword..."
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Search'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
              <Button
                size="small"
                onClick={clearFilters}
                sx={{ ml: 'auto' }}
              >
                Clear All
              </Button>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  label="Plan"
                >
                  {planOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  label="Location"
                >
                  {locationOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* Recent Searches */}
            <Typography variant="subtitle2" gutterBottom>
              Recent Searches
            </Typography>
            <List dense>
              {recentSearches.map((search, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch();
                  }}
                  sx={{ px: 0 }}
                >
                  <ListItemText 
                    primary={search} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12} md={9}>
          {searchResults.length > 0 ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              
              <List>
                {searchResults.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getResultIcon(result.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {getResultTitle(result)}
                            </Typography>
                            <Chip 
                              label={result.type.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${(result.score * 100).toFixed(0)}% match`} 
                              size="small" 
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {getResultSubtitle(result)}
                            </Typography>
                            {result.location && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {result.location}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < searchResults.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : searchQuery && !loading ? (
            <Alert severity="info">
              No results found for "{searchQuery}". Try adjusting your search terms or filters.
            </Alert>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Start your search
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Enter keywords, phone numbers, or names to search through subscriber records
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default Search;
