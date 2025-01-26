import {
    Close as CloseIcon,
    Edit as EditIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    Share as ShareIcon,
} from '@mui/icons-material';
import {
    Box,
    Card,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    alpha,
    styled,
} from '@mui/material';
import React, { useState } from 'react';

interface Activity {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  action: string;
  target: string;
  timestamp: Date;
  details?: string;
}

const ActivityCard = styled(Card)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  width: 360,
  maxHeight: 400,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
  zIndex: theme.zIndex.drawer + 1,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    transform: 'translateY(-4px)',
  },
}));

const ActivityHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ActivityList = styled(List)(({ theme }) => ({
  maxHeight: 320,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.2),
    borderRadius: 3,
  },
}));

const getActionIcon = (action: string) => {
  switch (action) {
    case 'edit':
      return <EditIcon fontSize="small" />;
    case 'share':
      return <ShareIcon fontSize="small" />;
    case 'settings':
      return <SettingsIcon fontSize="small" />;
    default:
      return <HistoryIcon fontSize="small" />;
  }
};

const ActivityHistory: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      userId: '1',
      username: 'John Doe',
      action: 'edit',
      target: 'Physics Parameters',
      timestamp: new Date(),
      details: 'Updated gravity to 9.8',
    },
    {
      id: '2',
      userId: '2',
      username: 'Jane Smith',
      action: 'share',
      target: 'Universe',
      timestamp: new Date(Date.now() - 5 * 60000),
      details: 'Shared with Team Alpha',
    },
    // Add more sample activities as needed
  ]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <ActivityCard>
      <ActivityHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="subtitle1">Recent Activity</Typography>
        </Box>
        <IconButton size="small" onClick={() => setIsVisible(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </ActivityHeader>

      <ActivityList>
        {activities.map((activity) => (
          <ListItem
            key={activity.id}
            sx={{
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemAvatar sx={{ minWidth: 40 }}>
              {getActionIcon(activity.action)}
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>{activity.username}</strong> {activity.action}ed{' '}
                  {activity.target}
                </Typography>
              }
              secondary={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {activity.details}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(activity.timestamp)}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </ActivityList>
    </ActivityCard>
  );
};

export default ActivityHistory;
