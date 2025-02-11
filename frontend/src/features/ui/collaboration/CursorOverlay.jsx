import { Box, Typography, alpha, styled } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { collaborationService } from '../../services/CollaborationService';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserCursor {
  userId: string;
  username: string;
  position: CursorPosition;
  color: string;
}

const CursorWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: theme.zIndex.tooltip,
  transition: 'transform 0.1s ease-out',
}));

const Cursor = styled('div')<{ color: string }>(({ color }) => ({
  width: 20,
  height: 20,
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '8px 5px 0 5px',
    borderColor: `${color} transparent transparent transparent`,
    transform: 'rotate(-45deg)',
  },
}));

const CursorLabel = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  left: 16,
  top: -8,
  fontSize: '0.75rem',
  padding: '2px 6px',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(4px)',
  boxShadow: theme.shadows[1],
  whiteSpace: 'nowrap',
}));

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
];

const CursorOverlay: React.FC = () => {
  const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      collaborationService.updateCursor({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const unsubscribe = collaborationService.subscribe((state) => {
      const userCursors = collaborationService.getUserCursors();
      const activeUsers = collaborationService.getActiveUsers();

      const updatedCursors = new Map<string, UserCursor>();
      userCursors.forEach((position, userId) => {
        const user = activeUsers.find(u => u.userId === userId);
        if (user) {
          updatedCursors.set(userId, {
            userId,
            username: user.username,
            position,
            color: colors[parseInt(userId, 16) % colors.length]
          });
        }
      });

      setCursors(updatedCursors);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      unsubscribe();
    };
  }, []);

  return (
    <>
      {Array.from(cursors.values()).map((cursor) => (
        <CursorWrapper
          key={cursor.userId}
          sx={{
            transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
          }}
        >
          <Cursor color={cursor.color} />
          <CursorLabel
            sx={{
              color: cursor.color,
              backgroundColor: alpha(cursor.color, 0.1),
            }}
          >
            {cursor.username}
          </CursorLabel>
        </CursorWrapper>
      ))}
    </>
  );
};

export default CursorOverlay;
