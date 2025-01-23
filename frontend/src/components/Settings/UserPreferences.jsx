import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPreferences,
  updatePreferences,
} from '../../store/slices/preferencesSlice';

const UserPreferences = () => {
  const dispatch = useDispatch();
  const preferences = useSelector(state => state);
  const loading = useSelector(state => state.preferences.loading);
  const error = useSelector(state => state.preferences.error);
  const [localPreferences, setLocalPreferences] = useState({
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    highContrast: false,
    fontSize: 16,
    dashboardLayout: 'grid',
    language: 'en',
    timezone: 'UTC',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleChange = name => event => {
    setLocalPreferences({
      ...localPreferences,
      [name]:
        event.target.checked !== undefined
          ? event.target.checked
          : event.target.value,
    });
  };

  const handleSliderChange = name => (event, newValue) => {
    setLocalPreferences({
      ...localPreferences,
      [name]: newValue,
    });
  };

  const handleSave = async () => {
    try {
      await dispatch(updatePreferences(localPreferences)).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the reducer
    }
  };

  if (loading) {
    return <Typography>Loading preferences...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Preferences saved successfully!
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Theme Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.theme === 'dark'}
                    onChange={e =>
                      handleChange('theme')(e.target.checked ? 'dark' : 'light')
                    }
                    data-testid="theme-toggle"
                  />
                }
                label="Dark Theme"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.emailNotifications}
                    onChange={handleChange('emailNotifications')}
                    data-testid="email-notifications-toggle"
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.pushNotifications}
                    onChange={handleChange('pushNotifications')}
                    data-testid="push-notifications-toggle"
                  />
                }
                label="Push Notifications"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Accessibility Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.highContrast}
                    onChange={handleChange('highContrast')}
                    data-testid="high-contrast-toggle"
                  />
                }
                label="High Contrast"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Font Size</Typography>
              <Slider
                value={localPreferences.fontSize}
                onChange={handleSliderChange('fontSize')}
                min={12}
                max={24}
                step={1}
                marks
                valueLabelDisplay="auto"
                data-testid="font-size-slider"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dashboard Layout
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={localPreferences.dashboardLayout}
                  onChange={handleChange('dashboardLayout')}
                  data-testid="dashboard-layout-select"
                >
                  <MenuItem value="grid">Grid</MenuItem>
                  <MenuItem value="list">List</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Localization
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={localPreferences.language}
                  onChange={handleChange('language')}
                  data-testid="language-select"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={localPreferences.timezone}
                  onChange={handleChange('timezone')}
                  data-testid="timezone-select"
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          data-testid="save-preferences"
        >
          Save Preferences
        </Button>
      </Box>
    </Box>
  );
};

export default UserPreferences;
