import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from '../../store/slices/userSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.user);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.username || 'User'}!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Overview
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Username:</strong> {currentUser?.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {currentUser?.email}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Your recent activity will appear here.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
