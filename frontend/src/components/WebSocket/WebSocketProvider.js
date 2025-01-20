import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WebSocketClient from '../../services/WebSocketClient';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const connected = useSelector(state => state.websocket.connected);

  const wsClient = useMemo(() => {
    return new WebSocketClient(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token && !connected) {
      wsClient.connect(token);
    }
    return () => {
      wsClient.disconnect();
    };
  }, [wsClient, isAuthenticated, token, connected]);

  const value = useMemo(
    () => ({
      connected,
      joinRoom: wsClient.joinRoom.bind(wsClient),
      leaveRoom: wsClient.leaveRoom.bind(wsClient),
      updateParameters: wsClient.updateParameters.bind(wsClient),
      requestMusicGeneration: wsClient.requestMusicGeneration.bind(wsClient),
      requestVisualizationUpdate:
        wsClient.requestVisualizationUpdate.bind(wsClient),
    }),
    [wsClient, connected]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default WebSocketProvider;
