import AudioSettings from '@/components/settings/AudioSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import VisualizationSettings from '@/components/settings/VisualizationSettings';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { useState } from 'react';

const Settings = () => {
  const [loading, setLoading] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <ThemeSettings />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <AudioSettings />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <VisualizationSettings />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <NotificationSettings />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;
