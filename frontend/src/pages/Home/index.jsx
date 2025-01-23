import { Box, Button, Container, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Welcome to Your App
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          A modern web application built with React, Material-UI, and Flask.
        </Typography>
        <Box sx={{ mt: 4 }}>
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
