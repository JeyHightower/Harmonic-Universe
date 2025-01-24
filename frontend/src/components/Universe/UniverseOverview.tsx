import { Universe } from '@/types/universe';
import {
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import React from 'react';

interface UniverseOverviewProps {
  universe: Universe;
}

const UniverseOverview: React.FC<UniverseOverviewProps> = ({ universe }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {universe.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {universe.is_public ? (
                <PublicIcon color="primary" />
              ) : (
                <LockIcon color="action" />
              )}
              <Typography variant="body2" color="text.secondary">
                {universe.is_public ? 'Public' : 'Private'} Universe
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                {universe.collaborators_count} Collaborators
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CommentIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                {universe.comments_count} Comments
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FavoriteIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                {universe.favorites_count} Favorites
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Physical Laws
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Gravity
              </Typography>
              <Typography variant="body1">{universe.gravity} m/s²</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Speed of Light
              </Typography>
              <Typography variant="body1">
                {universe.speed_of_light.toLocaleString()} km/s
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Time Dilation
              </Typography>
              <Typography variant="body1">{universe.time_dilation}x</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">
                {format(new Date(universe.created_at), 'PPP')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {format(new Date(universe.updated_at), 'PPP')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Parameters
              </Typography>
              <Typography variant="body1">
                {universe.parameters_count}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Guest Access
              </Typography>
              <Typography variant="body1">
                {universe.allow_guests ? 'Enabled' : 'Disabled'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default UniverseOverview;
