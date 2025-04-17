import { useCallback, useState, useEffect } from "react";
import errorService from "../services/errorService.mjs";

// Define WebSocket globally if it doesn't exist to prevent no-undef errors
if (typeof WebSocket === 'undefined') {
  // Check if we're in a browser or Node.js environment
  const globalObj = typeof window !== 'undefined' ? window : 
                   typeof global !== 'undefined' ? global : 
                   typeof globalThis !== 'undefined' ? globalThis : {};
                   
  // Use existing WebSocket if available, otherwise define placeholder values
  const WS = globalObj.WebSocket || {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };
  
  // Define WebSocket on the appropriate global object
  if (typeof window !== 'undefined') {
    window.WebSocket = window.WebSocket || WS;
  } else if (typeof global !== 'undefined') {
    global.WebSocket = global.WebSocket || WS;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.WebSocket = globalThis.WebSocket || WS;
  }
}

/**
 * Custom hook for handling WebSocket errors consistently across the application
 */

export function useWebSocketError({
  context,
  onError,
  onConnectionError,
  onMessageError,
  onCloseError,
  _retryCount = 3,
  _retryDelay = 1000,
}) {
  const [retryAttempts, setRetryAttempts] = useState(0);

  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const wsError = {
        name: error.name || "WebSocketError",
        message: error.message || "A WebSocket error occurred",
        code: error.code,
        type: error.type,
        wasClean: error.wasClean,
        details: error.details,
        socket: error.socket,
      };

      // Log the error using our error service
      errorService.handleError(wsError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific WebSocket error cases
      if (wsError.type === "connection") {
        // Handle connection errors
        if (onConnectionError) {
          onConnectionError(wsError);
        }
        return;
      }

      if (wsError.type === "message") {
        // Handle message errors
        if (onMessageError) {
          onMessageError(wsError);
        }
        return;
      }

      if (wsError.type === "close") {
        // Handle close errors
        if (onCloseError) {
          onCloseError(wsError);
        }
        return;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(wsError);
      }
    },
    [context, onError, onConnectionError, onMessageError, onCloseError]
  );

  const isWebSocketError = useCallback((error) => {
    return (
      error.name === "WebSocketError" ||
      error.type === "connection" ||
      error.type === "message" ||
      error.type === "close" ||
      error.message?.toLowerCase().includes("websocket")
    );
  }, []);

  const isConnectionError = useCallback((error) => {
    return (
      error.type === "connection" ||
      error.message?.toLowerCase().includes("connection")
    );
  }, []);

  const isMessageError = useCallback((error) => {
    return (
      error.type === "message" ||
      error.message?.toLowerCase().includes("message")
    );
  }, []);

  const isCloseError = useCallback((error) => {
    return (
      error.type === "close" || error.message?.toLowerCase().includes("close")
    );
  }, []);

  const getErrorMessage = useCallback((error) => {
    switch (error.code) {
      case 1000:
        return "WebSocket connection closed normally.";
      case 1001:
        return "WebSocket connection closed due to endpoint going away.";
      case 1002:
        return "WebSocket connection closed due to protocol error.";
      case 1003:
        return "WebSocket connection closed due to unsupported data.";
      case 1005:
        return "WebSocket connection closed with no status code.";
      case 1006:
        return "WebSocket connection closed abnormally.";
      case 1007:
        return "WebSocket connection closed due to invalid frame payload data.";
      case 1008:
        return "WebSocket connection closed due to policy violation.";
      case 1009:
        return "WebSocket connection closed due to message too big.";
      case 1010:
        return "WebSocket connection closed due to client not accepting extension.";
      case 1011:
        return "WebSocket connection closed due to server error.";
      case 1015:
        return "WebSocket connection closed due to TLS handshake failure.";
      default:
        return (
          error.message || "An error occurred with the WebSocket connection."
        );
    }
  }, []);

  // Get the appropriate WebSocket object based on environment
  const getWebSocketObj = useCallback(() => {
    // First try the global variable
    if (typeof WebSocket !== 'undefined') return WebSocket;
    
    // Then try browser or node specific globals
    if (typeof window !== 'undefined' && window.WebSocket) return window.WebSocket;
    if (typeof global !== 'undefined' && global.WebSocket) return global.WebSocket;
    if (typeof globalThis !== 'undefined' && globalThis.WebSocket) return globalThis.WebSocket;
    
    // Fallback constants if no WebSocket implementation is available
    return {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    };
  }, []);

  const getConnectionState = useCallback((socket) => {
    if (!socket) return "CLOSED";
    const WS = getWebSocketObj();
    
    switch (socket.readyState) {
      case WS.CONNECTING:
        return "CONNECTING";
      case WS.OPEN:
        return "OPEN";
      case WS.CLOSING:
        return "CLOSING";
      case WS.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }, [getWebSocketObj]);

  const resetRetryAttempts = useCallback(() => {
    setRetryAttempts(0);
  }, []);

  useEffect(() => {
    // Reset retry attempts when component unmounts
    return () => {
      resetRetryAttempts();
    };
  }, [resetRetryAttempts]);

  return {
    handleError,
    isWebSocketError,
    isConnectionError,
    isMessageError,
    isCloseError,
    getErrorMessage,
    getConnectionState,
    retryAttempts,
    resetRetryAttempts,
  };
}
