import { Box, FormControlLabel, FormGroup, Switch, Typography } from '@mui/material';
import React from 'react';

const NotificationSettings = () => {
  const [settings, setSettings] = React.useState({
    soundEnabled: true,
    emailNotifications: true,
    collaborationAlerts: true,
    updateNotifications: true,
  });

  const handleChange = event => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch checked={settings.soundEnabled} onChange={handleChange} name="soundEnabled" />
          }
          label="Sound Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={handleChange}
              name="emailNotifications"
            />
          }
          label="Email Notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.collaborationAlerts}
              onChange={handleChange}
              name="collaborationAlerts"
            />
          }
          label="Collaboration Alerts"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.updateNotifications}
              onChange={handleChange}
              name="updateNotifications"
            />
          }
          label="Update Notifications"
        />
      </FormGroup>
    </Box>
  );
};

export default NotificationSettings;
