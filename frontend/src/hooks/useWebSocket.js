import { useNotification } from '@/components/common/Notification';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useWebSocket = (universeId) => {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = parseInt(import.meta.env.VITE_WS_MAX_RETRIES || '3');
  const reconnectInterval = parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL || '5000');

  useEffect(() => {
    if (!token || !universeId) return;

    const connectSocket = () => {
      try {
        // Initialize socket connection with auth token
        socketRef.current = io(import.meta.env.VITE_WS_URL, {
          extraHeaders: {
            Authorization: `Bearer ${token}`
          },
          auth: {
            token: token
          },
          transportOptions: {
            polling: {
              extraHeaders: {
                Authorization: `Bearer ${token}`
              }
            }
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: reconnectInterval,
          reconnectionAttempts: maxReconnectAttempts,
        });

        // Connection event handlers
        socketRef.current.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;

          // Join universe room with token in payload
          socketRef.current.emit('join_universe', {
            universe_id: universeId,
            token: token
          });
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('WebSocket connection error:', err);
          setError(err.message);
          setIsConnected(false);

          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            showNotification('Failed to connect to server. Please try again later.', 'error');
          }
          reconnectAttemptsRef.current++;
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          setIsConnected(false);
        });

        socketRef.current.on('error', (error) => {
          console.error('WebSocket error:', error);
          setError(error.message);
          showNotification(error.message, 'error');
        });

        // Universe-specific events
        socketRef.current.on('user_joined', (data) => {
          console.log('User joined:', data);
        });

        socketRef.current.on('user_left', (data) => {
          console.log('User left:', data);
        });

        socketRef.current.on('physics_changed', (data) => {
          console.log('Physics changed:', data);
        });

        socketRef.current.on('harmony_changed', (data) => {
          console.log('Harmony changed:', data);
        });

      } catch (err) {
        console.error('Error initializing WebSocket:', err);
        setError(err.message);
        showNotification('Failed to initialize WebSocket connection', 'error');
      }
    };

    connectSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        if (isConnected) {
          socketRef.current.emit('leave_universe', {
            universe_id: universeId,
            token: token
          });
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, universeId, showNotification]);

  return {
    socket: socketRef.current,
    isConnected,
    error
  };
};
