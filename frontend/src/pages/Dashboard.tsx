import { RootState } from '@/store';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

const Dashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <Container>
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome back, {user?.username}!
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Your Projects
                            </Typography>
                            {/* Add project list component here */}
                            <Typography color="text.secondary">
                                No projects yet. Start creating!
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Activity
                            </Typography>
                            {/* Add activity list component here */}
                            <Typography color="text.secondary">
                                No recent activity to display.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Dashboard;
