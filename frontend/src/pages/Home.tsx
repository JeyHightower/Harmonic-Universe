import UniverseList from '@/components/Universe/UniverseList';
import { RootState } from '@/store';
import { openAuthModal } from '@/store/slices/authSlice';
import { fetchUniverses } from '@/store/slices/universeSlice';
import ExploreIcon from '@mui/icons-material/Explore';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { universes, loading } = useSelector(
    (state: RootState) => state.universe
  );

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleCreateUniverse = () => {
    if (isAuthenticated) {
      navigate('/universe/create');
    } else {
      dispatch(openAuthModal('register'));
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(/hero-bg.jpg)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Increase the priority of the hero background image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.5)',
          }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  p: { xs: 3, md: 6 },
                  pr: { md: 0 },
                }}
              >
                <Typography
                  component="h1"
                  variant="h2"
                  color="inherit"
                  gutterBottom
                >
                  Create Your Own Universe
                </Typography>
                <Typography variant="h5" color="inherit" paragraph>
                  Design, explore, and share unique universes with customizable
                  physics, parameters, and collaborative features. Join our
                  growing community of universe creators today.
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCreateUniverse}
                  >
                    Create Universe
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    color="inherit"
                    startIcon={<ExploreIcon />}
                    onClick={() => navigate('/explore')}
                  >
                    Explore Universes
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Featured Universes */}
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" gutterBottom>
          Featured Universes
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore some of our most popular and innovative universes created by
          our community.
        </Typography>
        <UniverseList universes={universes} loading={loading} />
      </Container>

      {/* How It Works */}
      <Box sx={{ bgcolor: 'background.paper', py: 8, mt: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center">
            How It Works
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  1. Create
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Design your universe with custom physics parameters and rules.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  2. Collaborate
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Invite others to contribute and expand your universe.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  3. Share
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Share your creation with the world and get feedback.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
