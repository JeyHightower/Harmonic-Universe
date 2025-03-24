import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface WebSocketError extends Error {
  code?: number;
  type?: string;
  wasClean?: boolean;
  details?: any;
  socket?: WebSocket;
}

interface UseWebSocketErrorOptions {
  context: string;
  onError?: (error: WebSocketError) => void;
  onConnectionError?: (error: WebSocketError) => void;
  onMessageError?: (error: WebSocketError) => void;
  onCloseError?: (error: WebSocketError) => void;
  retryCount?: number;
  retryDelay?: number;
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
  retryCount = 3,
  retryDelay = 1000,
}: UseWebSocketErrorOptions) {
  const handleError = useCallback(
    (error: WebSocketError) => {
      // Create a standardized error object
      const wsError: WebSocketError = {
        name: error.name || 'WebSocketError',
        message: error.message || 'A WebSocket error occurred',
        code: error.code,
        type: error.type,
        wasClean: error.wasClean,
        details: error.details,
        socket: error.socket,
      };

      // Log the error using our error service
      errorService.handleError(wsError, context, {
        timestamp: new Date().toISOString(),
        retryCount,
        retryDelay,
      });

      // Handle specific WebSocket error cases
      if (wsError.type === 'connection') {
        // Handle connection errors
        if (onConnectionError) {
          onConnectionError(wsError);
        }
        return;
      }

      if (wsError.type === 'message') {
        // Handle message errors
        if (onMessageError) {
          onMessageError(wsError);
        }
        return;
      }

      if (wsError.type === 'close') {
        // Handle close errors
        if (onCloseError) {
          onCloseError(wsError);
        }
        return;
      }

      // Handle specific error codes
      switch (wsError.code) {
        case 1000: // Normal closure
          // Handle normal closure
          break;
        case 1001: // Going away
          // Handle going away
          break;
        case 1002: // Protocol error
          // Handle protocol error
          break;
        case 1003: // Unsupported data
          // Handle unsupported data
          break;
        case 1005: // No status received
          // Handle no status received
          break;
        case 1006: // Abnormal closure
          // Handle abnormal closure
          break;
        case 1007: // Invalid frame payload data
          // Handle invalid frame payload
          break;
        case 1008: // Policy violation
          // Handle policy violation
          break;
        case 1009: // Message too big
          // Handle message too big
          break;
        case 1010: // Mandatory extension
          // Handle mandatory extension
          break;
        case 1011: // Internal server error
          // Handle internal server error
          break;
        case 1012: // Service restart
          // Handle service restart
          break;
        case 1013: // Try again later
          // Handle try again later
          break;
        case 1014: // Bad gateway
          // Handle bad gateway
          break;
        case 1015: // TLS handshake
          // Handle TLS handshake
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(wsError);
      }
    },
    [context, onError, onConnectionError, onMessageError, onCloseError, retryCount, retryDelay]
  );

  const isWebSocketError = useCallback((error: any): boolean => {
    return (
      error.name === 'WebSocketError' ||
      error.code?.toString().startsWith('WS_') ||
      error.message?.toLowerCase().includes('websocket') ||
      error.message?.toLowerCase().includes('socket')
    );
  }, []);

  const isConnectionError = useCallback((error: any): boolean => {
    return (
      error.type === 'connection' ||
      error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('connect')
    );
  }, []);

  const isMessageError = useCallback((error: any): boolean => {
    return (
      error.type === 'message' ||
      error.message?.toLowerCase().includes('message') ||
      error.message?.toLowerCase().includes('send') ||
      error.message?.toLowerCase().includes('receive')
    );
  }, []);

  const isCloseError = useCallback((error: any): boolean => {
    return (
      error.type === 'close' ||
      error.message?.toLowerCase().includes('close') ||
      error.message?.toLowerCase().includes('disconnect')
    );
  }, []);

  const getErrorMessage = useCallback((error: WebSocketError): string => {
    switch (error.code) {
      case 1000:
        return 'WebSocket connection closed normally.';
      case 1001:
        return 'WebSocket connection is going away.';
      case 1002:
        return 'WebSocket protocol error occurred.';
      case 1003:
        return 'WebSocket received unsupported data.';
      case 1005:
        return 'WebSocket closed without status code.';
      case 1006:
        return 'WebSocket connection closed abnormally.';
      case 1007:
        return 'WebSocket received invalid frame payload data.';
      case 1008:
        return 'WebSocket policy violation occurred.';
      case 1009:
        return 'WebSocket message is too big to process.';
      case 1010:
        return 'WebSocket mandatory extension is missing.';
      case 1011:
        return 'WebSocket internal server error occurred.';
      case 1012:
        return 'WebSocket service is restarting.';
      case 1013:
        return 'WebSocket service is temporarily unavailable.';
      case 1014:
        return 'WebSocket bad gateway error occurred.';
      case 1015:
        return 'WebSocket TLS handshake failed.';
      default:
        return error.message || 'A WebSocket error occurred';
    }
  }, []);

  const getConnectionState = useCallback((socket: WebSocket): string => {
    switch (socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }, []);

  return {
    handleError,
    isWebSocketError,
    isConnectionError,
    isMessageError,
    isCloseError,
    getErrorMessage,
    getConnectionState,
  };
} 