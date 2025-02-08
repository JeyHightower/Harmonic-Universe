import { demoLogin } from '@/store/slices/authSlice';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Box, Button, Container, Tooltip, Typography, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  const handleDemoLogin = async () => {
    try {
      await dispatch(demoLogin()).unwrap();
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
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Harmonic Universe
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Explore the intersection of music, physics, and artificial intelligence
        </Typography>
        <Box sx={{ mt: 4 }}>
          {!isAuthenticated && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 1 },
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    minWidth: '120px',
                    fontWeight: 600,
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    minWidth: '120px',
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Button>
              </Box>
              <Tooltip title="Try all features instantly with our demo account" arrow>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  startIcon={<PlayCircleOutlineIcon />}
                  sx={{
                    minWidth: '160px',
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: '25px',
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                      boxShadow: theme.shadows[8],
                    },
                    transition: theme.transitions.create(['background-color', 'box-shadow'], {
                      duration: theme.transitions.duration.short,
                    }),
                  }}
                >
                  {loading ? 'Loading...' : 'Try Demo'}
                </Button>
              </Tooltip>
            </Box>
          )}
          {isAuthenticated && (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{
                minWidth: '160px',
                fontWeight: 600,
              }}
            >
              Go to Dashboard
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
