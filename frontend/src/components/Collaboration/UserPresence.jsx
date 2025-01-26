import { Avatar, Box, Chip, Tooltip, Typography, alpha, styled } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { collaborationService } from '../../services/CollaborationService';

const PresenceContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  boxShadow: theme.shadows[4],
  zIndex: theme.zIndex.drawer + 1,
  maxWidth: 300,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    transform: 'translateY(-4px)',
  },
}));

const UserChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  },
  '& .MuiChip-avatar': {
    width: 24,
    height: 24,
  },
}));

const TypingIndicator = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  marginLeft: theme.spacing(1),
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.8)',
      opacity: 0.5,
    },
    '50%': {
      transform: 'scale(1.2)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(0.8)',
      opacity: 0.5,
    },
  },
}));

const UserPresence: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = collaborationService.subscribe((state) => {
      setActiveUsers(collaborationService.getActiveUsers());
    });

    return () => unsubscribe();
  }, []);

  if (activeUsers.length === 0) return null;

  return (
    <PresenceContainer>
      <Typography variant="subtitle2" gutterBottom>
        Active Users ({activeUsers.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {activeUsers.map((user) => (
          <Tooltip
            key={user.userId}
            title={`${user.username} - ${user.currentView}${user.isTyping ? ' (typing...)' : ''}`}
            arrow
          >
            <UserChip
              avatar={<Avatar alt={user.username} src={user.avatar} />}
              label={user.username}
              variant="outlined"
              icon={user.isTyping ? <TypingIndicator /> : undefined}
            />
          </Tooltip>
        ))}
      </Box>
    </PresenceContainer>
  );
};

export default UserPresence;
