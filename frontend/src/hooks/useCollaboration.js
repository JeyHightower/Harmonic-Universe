import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import collaborationService from '../../services/collaborationService';

export const useCollaboration = universeId => {
  const [collaborators, setCollaborators] = useState([]);
  const [cursorPositions, setCursorPositions] = useState({});
  const [isCollaborating, setIsCollaborating] = useState(false);
  const currentUser = useSelector(state => state.auth.user);

  const startCollaboration = useCallback(async () => {
    try {
      const response = await fetch(`/api/universes/${universeId}/collaborate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start collaboration');
      }

      const { room_token } = await response.json();
      collaborationService.joinRoom(
        room_token,
        currentUser.id,
        currentUser.username
      );
      setIsCollaborating(true);
    } catch (error) {
      console.error('Collaboration error:', error);
      setIsCollaborating(false);
    }
  }, [universeId, currentUser]);

  const stopCollaboration = useCallback(() => {
    collaborationService.leaveRoom();
    setIsCollaborating(false);
    setCollaborators([]);
    setCursorPositions({});
  }, []);

  const updateCursor = useCallback(
    (x, y, parameterType) => {
      if (isCollaborating) {
        collaborationService.updateCursorPosition(x, y, parameterType);
      }
    },
    [isCollaborating]
  );

  const updateParameter = useCallback(
    (parameterType, value) => {
      if (isCollaborating) {
        collaborationService.updateParameter(parameterType, value);
      }
    },
    [isCollaborating]
  );

  // Update collaborators list
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCollaborating) {
        setCollaborators(collaborationService.getCollaborators());
        setCursorPositions(collaborationService.getCursorPositions());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCollaborating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCollaborating) {
        stopCollaboration();
      }
    };
  }, [isCollaborating, stopCollaboration]);

  return {
    collaborators,
    cursorPositions,
    isCollaborating,
    startCollaboration,
    stopCollaboration,
    updateCursor,
    updateParameter,
  };
};

export default useCollaboration;
