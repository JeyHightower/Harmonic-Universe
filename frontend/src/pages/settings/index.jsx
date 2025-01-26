import { RootState } from "@/store";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useSelector } from "react-redux";

const Settings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [themePreference, setThemePreference] = useState("system");

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement settings update
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={4}>
        {/* Settings Navigation */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderRight: 1, borderColor: "divider" }}
            >
              <Tab label="Profile" value="profile" />
              <Tab label="Account" value="account" />
              <Tab label="Preferences" value="preferences" />
              <Tab label="Notifications" value="notifications" />
              <Tab label="Security" value="security" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            {activeTab === "profile" && (
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      defaultValue={user?.username}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={4}
                      placeholder="Tell us about yourself"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Location" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Website" />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3 }}>
                  <Button type="submit" variant="contained">
                    Save Changes
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === "account" && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Settings
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      defaultValue={user?.email}
                    />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" color="error" gutterBottom>
                  Danger Zone
                </Typography>
                <Button variant="outlined" color="error">
                  Delete Account
                </Button>
              </Box>
            )}

            {activeTab === "preferences" && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Preferences
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Theme"
                      value={themePreference}
                      onChange={(e) => setThemePreference(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === "notifications" && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
              </Box>
            )}

            {activeTab === "security" && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <Button variant="contained" color="primary">
                  Change Password
                </Button>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                <Button variant="outlined">Enable 2FA</Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;
