import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Layout from './components/Layout/Layout';

// Page components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Subscribers from './pages/Subscribers';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import Upload from './pages/Upload';
import Settings from './pages/Settings';

// Services
import { authAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      if (response.data) {
        setIsAuthenticated(true);
        setUser(response.data);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh' 
          }}
        >
          <CircularProgress size={60} />
        </Box>
      );
    }
    
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Dashboard />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subscribers" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Subscribers />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Search />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Analytics />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Upload />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Layout user={user}>
                  <Settings />
                </Layout>
              </Box>
            </ProtectedRoute>
          } 
        />
      </Routes>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
