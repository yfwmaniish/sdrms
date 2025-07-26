import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material';

function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    realTimeSync: true,
    emailNotifications: true,
    smsNotifications: false,
    logLevel: 'INFO',
    maxConcurrentUsers: 100,
    sessionTimeout: 30,
    dataRetentionDays: 365
  });

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Admin',
      email: 'john@sdrms.com',
      role: 'Administrator',
      status: 'Active',
      lastLogin: '2024-01-26 10:30:00'
    },
    {
      id: 2,
      name: 'Jane Manager',
      email: 'jane@sdrms.com',
      role: 'Manager',
      status: 'Active',
      lastLogin: '2024-01-26 09:15:00'
    },
    {
      id: 3,
      name: 'Mike Analyst',
      email: 'mike@sdrms.com',
      role: 'Analyst',
      status: 'Inactive',
      lastLogin: '2024-01-25 16:45:00'
    }
  ]);

  const handleSettingChange = (setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    // In real app, save to backend
    console.log('Saving settings:', systemSettings);
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpenUserDialog(true);
  };

  const handleUserAdd = () => {
    setSelectedUser({
      name: '',
      email: '',
      role: 'Analyst',
      status: 'Active'
    });
    setEditMode(false);
    setOpenUserDialog(true);
  };

  const handleUserDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUserSave = () => {
    if (editMode) {
      setUsers(users.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      ));
    } else {
      const newUser = {
        ...selectedUser,
        id: Math.max(...users.map(u => u.id)) + 1,
        lastLogin: 'Never'
      };
      setUsers([...users, newUser]);
    }
    setOpenUserDialog(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator':
        return 'error';
      case 'Manager':
        return 'warning';
      case 'Analyst':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'default';
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<SettingsIcon />} label="System Settings" />
          <Tab icon={<PeopleIcon />} label="User Management" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<StorageIcon />} label="Database" />
        </Tabs>

        {/* System Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    General Settings
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.autoBackup}
                          onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                        />
                      }
                      label="Automatic Backup"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.realTimeSync}
                          onChange={(e) => handleSettingChange('realTimeSync', e.target.checked)}
                        />
                      }
                      label="Real-time Synchronization"
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Log Level</InputLabel>
                      <Select
                        value={systemSettings.logLevel}
                        onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                        label="Log Level"
                      >
                        <MenuItem value="DEBUG">Debug</MenuItem>
                        <MenuItem value="INFO">Info</MenuItem>
                        <MenuItem value="WARN">Warning</MenuItem>
                        <MenuItem value="ERROR">Error</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Max Concurrent Users"
                      type="number"
                      value={systemSettings.maxConcurrentUsers}
                      onChange={(e) => handleSettingChange('maxConcurrentUsers', parseInt(e.target.value))}
                      sx={{ mt: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Session Timeout (minutes)"
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifications
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.smsNotifications}
                          onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                        />
                      }
                      label="SMS Notifications"
                    />
                    <TextField
                      fullWidth
                      label="Data Retention (days)"
                      type="number"
                      value={systemSettings.dataRetentionDays}
                      onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                      sx={{ mt: 2 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </Box>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">User Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleUserAdd}
            >
              Add User
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>{user.name.charAt(0)}</Avatar>
                        {user.name}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleUserEdit(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleUserDelete(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Policies
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Password Policy"
                        secondary="Minimum 8 characters, mixed case, numbers"
                      />
                      <ListItemSecondaryAction>
                        <Switch defaultChecked />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Two-Factor Authentication"
                        secondary="Require 2FA for all users"
                      />
                      <ListItemSecondaryAction>
                        <Switch />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="IP Whitelisting"
                        secondary="Restrict access by IP address"
                      />
                      <ListItemSecondaryAction>
                        <Switch />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Audit Logs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent security events:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Failed login attempt"
                        secondary="IP: 192.168.1.100 - 2024-01-26 10:30"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User role changed"
                        secondary="User: jane@sdrms.com - 2024-01-26 09:15"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Data export"
                        secondary="User: john@sdrms.com - 2024-01-25 16:45"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Database Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Database Status
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">MongoDB: Connected</Typography>
                    <Typography variant="body2">OpenSearch: Online</Typography>
                    <Typography variant="body2">Redis Cache: Active</Typography>
                    <Typography variant="body2">Last Backup: 2024-01-26 02:00:00</Typography>
                  </Box>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Run Backup Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">Database Size: 2.4 GB</Typography>
                    <Typography variant="body2">Query Response Time: 23ms</Typography>
                    <Typography variant="body2">Active Connections: 45</Typography>
                    <Typography variant="body2">Index Usage: 87%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={selectedUser?.name || ''}
                onChange={(e) => setSelectedUser({
                  ...selectedUser,
                  name: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={selectedUser?.email || ''}
                onChange={(e) => setSelectedUser({
                  ...selectedUser,
                  email: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser?.role || 'Analyst'}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    role: e.target.value
                  })}
                  label="Role"
                >
                  <MenuItem value="Administrator">Administrator</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Analyst">Analyst</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedUser?.status || 'Active'}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    status: e.target.value
                  })}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleUserSave} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Settings;
