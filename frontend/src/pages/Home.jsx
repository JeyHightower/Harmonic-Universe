import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { Box, Button, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, demoLogin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={4}
      p={3}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to Harmonic Universe
      </Typography>

      <Typography variant="h5" component="h2" gutterBottom>
        Explore the intersection of music and technology
      </Typography>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Try Demo'}
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
