import { login } from '@/store/slices/authSlice';
import { Box, Button, Container, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  const handleDemoLogin = async () => {
    try {
      await dispatch(
        login({
          email: 'demo@example.com',
          password: 'password',
        })
      ).unwrap();
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the Redux slice
    }
  };

  return (
    <Container>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Harmonic Universe
        </Typography>

        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: '800px' }}>
          Create, explore, and share your musical universes. Experience the harmony of infinite
          possibilities.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {isAuthenticated ? (
            <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={handleDemoLogin}
              sx={{
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                boxShadow: theme => theme.shadows[4],
                '&:hover': {
                  boxShadow: theme => theme.shadows[8],
                },
              }}
            >
              Try Demo Account
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '800px' }}>
          <Typography variant="h4" component="h2">
            Features
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <FeatureCard
              title="Musical Universes"
              description="Create and customize your own musical universes with unique parameters and harmonies."
            />
            <FeatureCard
              title="Real-time Collaboration"
              description="Work together with others in real-time to compose and explore musical possibilities."
            />
            <FeatureCard
              title="Advanced Visualization"
              description="See your music come to life with beautiful, interactive visualizations."
            />
            <FeatureCard
              title="AI-Powered Generation"
              description="Let AI help you discover new musical patterns and compositions."
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

const FeatureCard = ({ title, description }) => (
  <Box
    sx={{
      p: 3,
      borderRadius: 2,
      bgcolor: 'background.paper',
      boxShadow: theme => theme.shadows[1],
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        boxShadow: theme => theme.shadows[4],
        transform: 'translateY(-4px)',
      },
    }}
  >
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export default Home;
