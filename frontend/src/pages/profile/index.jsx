import {
  Edit as EditIcon,
  Language,
  Notifications,
  Palette,
  PhotoCamera,
  Security,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, updateSettings } from "../store/slices/profileSlice";

const Profile = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, profile, settings } = useSelector((state) => state.profile);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
  });

  const handleEditToggle = () => {
    if (editing) {
      dispatch(
        updateProfile({
          display_name: formData.displayName,
          bio: formData.bio,
          location: formData.location,
        }),
      );
    }
    setEditing(!editing);
  };

  const handleSettingChange = (setting, value) => {
    dispatch(
      updateSettings({
        [setting]: value,
      }),
    );
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profile?.avatar_url}
              alt={profile?.display_name}
              sx={{
                width: 120,
                height: 120,
                border: 3,
                borderColor: "primary.main",
              }}
            />
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "primary.main",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
            >
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {editing ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  sx={{ mr: 2 }}
                />
              ) : (
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {profile?.display_name || user?.username}
                </Typography>
              )}
              <Button
                variant={editing ? "contained" : "outlined"}
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
              >
                {editing ? "Save" : "Edit Profile"}
              </Button>
            </Box>

            {editing ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {profile?.bio || "No bio yet"}
              </Typography>
            )}

            {editing ? (
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                📍 {profile?.location || "No location set"}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.notifications_enabled}
                    onChange={(e) =>
                      handleSettingChange(
                        "notifications_enabled",
                        e.target.checked,
                      )
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Notifications fontSize="small" />
                    <Typography>Enable Notifications</Typography>
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.dark_mode}
                    onChange={(e) =>
                      handleSettingChange("dark_mode", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Palette fontSize="small" />
                    <Typography>Dark Mode</Typography>
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.public_profile}
                    onChange={(e) =>
                      handleSettingChange("public_profile", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Language fontSize="small" />
                    <Typography>Public Profile</Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Security
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Security />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Change Password
              </Button>

              <Button variant="outlined" color="error" fullWidth>
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
