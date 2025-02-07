import { Box, Button, Container, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector(state => state.auth);

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
                        <Box sx={{ '& > *': { mx: 1 } }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/register')}
                            >
                                Get Started
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={() => navigate('/login')}
                            >
                                Sign In
                            </Button>
                        </Box>
                    )}
                    {isAuthenticated && (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/dashboard')}
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
