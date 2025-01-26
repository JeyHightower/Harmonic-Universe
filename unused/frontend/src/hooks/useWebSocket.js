import { useCallback, useEffect, useRef } from "react";
import websocketService from "../../services/websocket";

export const useWebSocket = (url, options = {}) => {
  const {
    onConnect,
    onDisconnect,
    onError,
    handlers = {},
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const reconnectTimer = useRef(null);
  const isConnected = useRef(false);

  const connect = useCallback(() => {
    try {
      websocketService.connect(url, {
        reconnection: autoReconnect,
        reconnectionDelay: reconnectInterval,
      });
      isConnected.current = true;
      onConnect?.();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      onError?.(error);
      if (autoReconnect) {
        reconnectTimer.current = setTimeout(connect, reconnectInterval);
      }
    }
  }, [url, autoReconnect, reconnectInterval, onConnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    websocketService.disconnect();
    isConnected.current = false;
    onDisconnect?.();
  }, [onDisconnect]);

  // Set up event handlers
  useEffect(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      websocketService.on(event, handler);
    });

    // Cleanup handlers on unmount
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        websocketService.off(event, handler);
      });
    };
  }, [handlers]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const emit = useCallback((event, data) => {
    websocketService.emit(event, data);
  }, []);

  return {
    isConnected: isConnected.current,
    emit,
    connect,
    disconnect,
  };
};

export default useWebSocket;
