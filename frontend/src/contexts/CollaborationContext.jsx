import { useNotification } from '@/components/common/Notification';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectCurrentUniverse, updateRealtimeStatus } from '@/store/slices/universeSlice';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const CollaborationContext = createContext({});

export const useCollaboration = () => useContext(CollaborationContext);

export const CollaborationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const currentUser = useSelector(selectCurrentUser);
  const currentUniverse = useSelector(selectCurrentUniverse);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeUsers, setActiveUsers] = useState({});
  const [version, setVersion] = useState(0);

  // Connect to WebSocket
  useEffect(() => {
    if (!currentUniverse?.id || !currentUser) return;

    const connectWebSocket = async () => {
      try {
        const ws = new WebSocket(
          `${import.meta.env.VITE_WS_URL}/ws/universe/${currentUniverse.id}?token=${localStorage.getItem('token')}`
        );

        ws.onopen = () => {
          setConnected(true);
          showNotification('Connected to collaboration server', 'success');
        };

        ws.onclose = () => {
          setConnected(false);
          showNotification('Disconnected from collaboration server', 'warning');
        };

        ws.onmessage = event => {
          const message = JSON.parse(event.data);
          handleMessage(message);
        };

        socketRef.current = ws;

        return () => {
          ws.close();
        };
      } catch (error) {
        showNotification('Failed to connect to collaboration server', 'error');
      }
    };

    connectWebSocket();
  }, [currentUniverse?.id, currentUser]);

  // Handle incoming messages
  const handleMessage = message => {
    switch (message.type) {
      case 'initial_state':
        setCursors(
          message.data.cursors.reduce((acc, cursor) => {
            acc[cursor.user_id] = cursor;
            return acc;
          }, {})
        );
        setChatMessages(message.data.chat_messages);
        setComments(message.data.comments);
        setActiveUsers(message.data.active_users);
        setVersion(message.data.current_version);
        break;

      case 'cursor_update':
        setCursors(prev => ({
          ...prev,
          [message.data.user_id]: message.data,
        }));
        break;

      case 'chat_message':
        setChatMessages(prev => [...prev, message.data]);
        break;

      case 'add_comment':
        setComments(prev => [...prev, message.data]);
        break;

      case 'resolve_comment':
        setComments(prev =>
          prev.map(comment =>
            comment.id === message.data.comment_id ? { ...comment, resolved: true } : comment
          )
        );
        break;

      case 'user_joined':
        setActiveUsers(prev => ({
          ...prev,
          [message.data.user_id]: message.data.username,
        }));
        showNotification(`${message.data.username} joined`, 'info');
        break;

      case 'user_left':
        setActiveUsers(prev => {
          const newUsers = { ...prev };
          delete newUsers[message.data.user_id];
          return newUsers;
        });
        setCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[message.data.user_id];
          return newCursors;
        });
        break;

      case 'operation':
        handleOperation(message.data);
        break;
    }
  };

  // Send cursor position
  const updateCursor = position => {
    if (!connected || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'cursor_update',
        data: {
          x: position.x,
          y: position.y,
          color: currentUser.color || '#1976d2',
        },
      })
    );
  };

  // Send chat message
  const sendChatMessage = (content, type = 'message') => {
    if (!connected || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'chat_message',
        data: {
          content,
          type,
        },
      })
    );
  };

  // Add comment
  const addComment = (content, position) => {
    if (!connected || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'add_comment',
        data: {
          content,
          position,
        },
      })
    );
  };

  // Resolve comment
  const resolveComment = commentId => {
    if (!connected || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'resolve_comment',
        data: {
          comment_id: commentId,
        },
      })
    );
  };

  // Send operation
  const sendOperation = (type, path, value) => {
    if (!connected || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'operation',
        data: {
          type,
          path,
          value,
        },
      })
    );
  };

  // Handle incoming operation
  const handleOperation = operation => {
    // Apply the operation to the local state
    setVersion(operation.version);

    // Update the universe state based on the operation
    dispatch(
      updateRealtimeStatus({
        lastOperation: operation,
        version: operation.version,
      })
    );
  };

  const value = {
    connected,
    cursors,
    chatMessages,
    comments,
    activeUsers,
    version,
    updateCursor,
    sendChatMessage,
    addComment,
    resolveComment,
    sendOperation,
  };

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
};

export default CollaborationProvider;
