import UniverseList from '@/components/Universe/UniverseList';
import { RootState } from '@/store';
import { fetchUniverses } from '@/store/slices/universeSlice';
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { universes, loading } = useSelector(
    (state: RootState) => state.universe
  );
  const [activeTab, setActiveTab] = useState('universes');

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const userUniverses = universes.filter(u => u.creator_id === user?.id);
  const collaboratingUniverses = universes.filter(u =>
    u.collaborators?.some(c => c.user_id === user?.id)
  );
  const favoriteUniverses = universes.filter(u => u.is_favorited);

  return (
    <Container maxWidth="lg">
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              alt={user?.username}
              src={user?.avatar}
              sx={{ width: 120, height: 120 }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {user?.username}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Member since{' '}
              {new Date(user?.created_at || '').toLocaleDateString()}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => {
                  /* TODO: Implement edit profile */
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md="auto">
            <Grid container spacing={2}>
              <Grid item xs={4} md={12}>
                <Typography variant="h6">{user?.universes_count}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Universes
                </Typography>
              </Grid>
              <Grid item xs={4} md={12}>
                <Typography variant="h6">
                  {user?.collaborations_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Collaborations
                </Typography>
              </Grid>
              <Grid item xs={4} md={12}>
                <Typography variant="h6">{user?.favorites_count}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Favorites
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="profile tabs"
        >
          <Tab label="My Universes" value="universes" />
          <Tab label="Collaborating" value="collaborating" />
          <Tab label="Favorites" value="favorites" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mb: 4 }}>
        {activeTab === 'universes' && (
          <UniverseList universes={userUniverses} loading={loading} />
        )}
        {activeTab === 'collaborating' && (
          <UniverseList universes={collaboratingUniverses} loading={loading} />
        )}
        {activeTab === 'favorites' && (
          <UniverseList universes={favoriteUniverses} loading={loading} />
        )}
      </Box>
    </Container>
  );
};

export default Profile;
