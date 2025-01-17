import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaboration must be used within a CollaborationProvider'
    );
  }
  return context;
};

export const CollaborationProvider = ({ children, universeId }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeEditors, setActiveEditors] = useState({});
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const newSocket = io(
      process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001',
      {
        query: { universeId },
      }
    );

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
    });

    newSocket.on('users:update', users => {
      setOnlineUsers(users);
    });

    newSocket.on('editor:update', editors => {
      setActiveEditors(editors);
    });

    newSocket.on('comments:update', newComments => {
      setComments(newComments);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [universeId]);

  const addComment = (storyboardId, comment) => {
    if (socket) {
      socket.emit('comment:add', { storyboardId, comment });
    }
  };

  const updateEditorState = (storyboardId, state) => {
    if (socket) {
      socket.emit('editor:state', { storyboardId, state });
    }
  };

  const value = {
    socket,
    onlineUsers,
    activeEditors,
    comments,
    addComment,
    updateEditorState,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

CollaborationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  universeId: PropTypes.string.isRequired,
};

export default CollaborationContext;
