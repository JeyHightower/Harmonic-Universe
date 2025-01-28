import io from 'socket.io-client';
import { store } from '../store';
import {
  addCollaborator,
  deleteUniverse,
  removeCollaborator,
  updateUniverseParameters,
} from '../store/slices/universeSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.handlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.lastHeartbeatResponse = null;
    this.heartbeatTimeout = null;
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        Authorization: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      pingTimeout: 30000, // 30 seconds
      pingInterval: 10000, // 10 seconds
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  startHeartbeat() {
    // Clear any existing intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    // Start sending heartbeats every 10 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.emit('heartbeat');

        // Set timeout for heartbeat response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('No heartbeat response received');
          this.reconnect();
        }, 5000); // Wait 5 seconds for response
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.disconnect();
      return;
    }

    console.log('Attempting to reconnect...');
    this.reconnectAttempts++;
    this.socket?.connect();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('client_ready');
      this.startHeartbeat();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.stopHeartbeat();
    });

    this.socket.on('error', error => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('parameters_updated', data => {
      store.dispatch(updateUniverseParameters(data));
    });

    this.socket.on('collaborator_added', data => {
      store.dispatch(addCollaborator(data));
    });

    this.socket.on('collaborator_removed', data => {
      store.dispatch(removeCollaborator(data));
    });

    this.socket.on('universe_deleted', data => {
      store.dispatch(deleteUniverse(data.id));
    });
  }

  joinUniverse(universeId) {
    if (!this.socket?.connected) return;
    this.socket.emit('join', { universe_id: universeId });
  }

  leaveUniverse(universeId) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave', { universe_id: universeId });
  }

  startSimulation(universeId) {
    if (this.socket) {
      this.socket.emit('start_simulation', { universe_id: universeId });
    }
  }

  stopSimulation(universeId) {
    if (this.socket) {
      this.socket.emit('stop_simulation', { universe_id: universeId });
    }
  }

  resetSimulation(universeId) {
    if (this.socket) {
      this.socket.emit('reset_simulation', { universe_id: universeId });
    }
  }

  updateParameters(universeId, parameters) {
    if (!this.socket?.connected) return;
    this.socket.emit('parameter_update', {
      universe_id: universeId,
      parameters,
    });
  }

  updateCursor(universeId, position) {
    if (!this.socket?.connected) return;
    this.socket.emit('cursor_move', {
      universe_id: universeId,
      position,
    });
  }

  sendChatMessage(universeId, message) {
    if (!this.socket?.connected) return;
    this.socket.emit('chat_message', {
      universe_id: universeId,
      message,
    });
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
    this.socket?.on(event, handler);
  }

  off(event, handler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      this.socket?.off(event, handler);
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getConnectionState() {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

export default new WebSocketService();
