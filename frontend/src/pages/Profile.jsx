import {
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userService } from '../services/userService';

const Profile = () => {
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    showEmail: user?.showEmail || false,
    showActivity: user?.showActivity || true,
    notifyOnMention: user?.notifyOnMention || true,
    notifyOnCollaboration: user?.notifyOnCollaboration || true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        showEmail: user.showEmail || false,
        showActivity: user.showActivity || true,
        notifyOnMention: user.notifyOnMention || true,
        notifyOnCollaboration: user.notifyOnCollaboration || true,
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = field => event => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await userService.updateProfile(profileData);
      dispatch({ type: 'auth/updateUser', payload: updatedUser });
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const updatedUser = await userService.uploadAvatar(user.id, file);
      dispatch({ type: 'auth/updateUser', payload: updatedUser });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={user?.avatarUrl}
                      sx={{ width: 100, height: 100, cursor: 'pointer' }}
                      onClick={handleAvatarClick}
                    >
                      {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'background.paper',
                      }}
                      onClick={handleAvatarClick}
                    >
                      <CameraIcon />
                    </IconButton>
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Box>
                  <Box sx={{ ml: 3 }}>
                    <Typography variant="h5" gutterBottom>
                      {user?.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Member since{' '}
                      {new Date(user?.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Button
                      variant={editMode ? 'contained' : 'outlined'}
                      startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                      onClick={editMode ? handleSave : () => setEditMode(true)}
                      disabled={loading}
                    >
                      {editMode ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </Box>
                </Box>

                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Profile" />
                  <Tab label="Privacy" />
                  <Tab label="Notifications" />
                </Tabs>

                <Box sx={{ mt: 3 }}>
                  {tabValue === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Username"
                          value={profileData.username}
                          onChange={handleChange('username')}
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={profileData.email}
                          onChange={handleChange('email')}
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bio"
                          multiline
                          rows={4}
                          value={profileData.bio}
                          onChange={handleChange('bio')}
                          disabled={!editMode}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {tabValue === 1 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={profileData.showEmail}
                              onChange={handleChange('showEmail')}
                              disabled={!editMode}
                            />
                          }
                          label="Show email to other users"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={profileData.showActivity}
                              onChange={handleChange('showActivity')}
                              disabled={!editMode}
                            />
                          }
                          label="Show my activity in public feed"
                        />
                      </Grid>
                    </Grid>
                  )}

                  {tabValue === 2 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={profileData.notifyOnMention}
                              onChange={handleChange('notifyOnMention')}
                              disabled={!editMode}
                            />
                          }
                          label="Notify me when I'm mentioned"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={profileData.notifyOnCollaboration}
                              onChange={handleChange('notifyOnCollaboration')}
                              disabled={!editMode}
                            />
                          }
                          label="Notify me about collaboration requests"
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>

                {error && (
                  <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile;
