import { Box, CircularProgress, Typography } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, refreshing } = useAuth();
  const location = useLocation();

  // Check for auth token during transitions
  const hasToken = !!localStorage.getItem('token');

  if (loading || refreshing) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          gap: 2,
        }}
      >
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          {loading ? 'Loading your profile...' : 'Refreshing session...'}
        </Typography>
      </Box>
    );
  }

  // Allow access if authenticated or has token during transition
  if (!isAuthenticated && !hasToken) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
