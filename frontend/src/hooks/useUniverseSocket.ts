import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export interface UniverseState {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  creatorId: number;
  collaborators: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  musicParameters: {
    tempo: number;
    key: string;
    scale: string;
  };
  visualParameters: {
    colorScheme: string;
    particleSize: number;
  };
}

export interface UseUniverseSocketProps {
  universeId: number;
  onUserJoined?: (user: { id: number; username: string }) => void;
  onUserLeft?: (userId: number) => void;
  onPhysicsUpdated?: (params: any) => void;
  onPresenceUpdated?: (presence: any) => void;
  onError?: (error: { message: string }) => void;
}

export function useUniverseSocket({
  universeId,
  onUserJoined,
  onUserLeft,
  onPhysicsUpdated,
  onPresenceUpdated,
  onError,
}: UseUniverseSocketProps) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<UniverseState>({
    id: 0,
    name: '',
    description: '',
    isPublic: true,
    createdAt: '',
    updatedAt: '',
    creatorId: 0,
    collaborators: [],
    musicParameters: {
      tempo: 120,
      key: 'C',
      scale: 'major'
    },
    visualParameters: {
      colorScheme: 'default',
      particleSize: 1.0
    }
  });
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !universeId) return;

    const newSocket = io(
      process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
      {
        auth: { token },
        transports: ['websocket'],
      }
    );

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_universe', {
        universe_id: universeId,
        current_view: window.location.pathname,
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('error', error => {
      onError?.(error);
    });

    newSocket.on('universe_state', newState => {
      setState({
        id: newState.id,
        name: newState.name,
        description: newState.description,
        isPublic: newState.is_public,
        createdAt: newState.created_at,
        updatedAt: newState.updated_at,
        creatorId: newState.creator_id,
        collaborators: newState.collaborators,
        musicParameters: newState.music_parameters,
        visualParameters: newState.visual_parameters
      });
    });

    newSocket.on('user_joined', data => {
      setState(prev => ({
        ...prev,
        collaborators: [
          ...prev.collaborators,
          {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
          },
        ],
      }));
      onUserJoined?.(data.user);
    });

    newSocket.on('user_left', data => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(user => user.id !== data.user_id),
      }));
      onUserLeft?.(data.user_id);
    });

    newSocket.on('physics_updated', data => {
      setState(prev => ({
        ...prev,
        musicParameters: data.music_parameters,
        visualParameters: data.visual_parameters
      }));
      onPhysicsUpdated?.(data);
    });

    newSocket.on('presence_updated', data => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(user =>
          user.id === data.user_id
            ? {
                ...user,
                email: data.email,
              }
            : user
        ),
      }));
      onPresenceUpdated?.(data);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket.connected) {
        newSocket.emit('leave_universe', { universe_id: universeId });
      }
      newSocket.close();
    };
  }, [token, universeId]);

  // Update physics parameters
  const updatePhysics = useCallback(
    (parameters: Partial<UniverseState['musicParameters']> | Partial<UniverseState['visualParameters']>) => {
      if (!socket || !isConnected) return;
      socket.emit('update_physics', {
        universe_id: universeId,
        parameters,
      });
    },
    [socket, isConnected, universeId]
  );

  // Update presence
  const updatePresence = useCallback(
    (currentView?: string, cursorPosition?: { x: number; y: number }) => {
      if (!socket || !isConnected) return;
      socket.emit('update_presence', {
        universe_id: universeId,
        current_view: currentView,
        cursor_position: cursorPosition,
      });
    },
    [socket, isConnected, universeId]
  );

  return {
    state,
    isConnected,
    updatePhysics,
    updatePresence,
  };
}
