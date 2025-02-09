import { updateCollaborationState } from '@/store/slices/collaborationSlice';
import { updateObjectTransform } from '@/store/slices/physicsSlice';
import { updateHarmonyParameters } from '@/store/slices/universeSlice';
import { updateVisualizationData } from '@/store/slices/visualizationSlice';
import { store } from '@/store/store';
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = import.meta.env.VITE_WS_RECONNECT_ATTEMPTS || 5;
    this.reconnectDelay = import.meta.env.VITE_WS_RECONNECT_DELAY || 1000;
    this.collaborators = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem(import.meta.env.VITE_AUTH_STORAGE_KEY),
      },
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection Events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason);
      this.handleDisconnect();
    });

    this.socket.on('error', error => {
      console.error('WebSocket error:', error);
    });

    // Initial State
    this.socket.on('initial_state', data => {
      store.dispatch(updateCollaborationState(data));
    });

    // Collaboration Events
    this.socket.on('user_joined', data => {
      this.collaborators.set(data.user_id, data);
      store.dispatch(
        updateCollaborationState({
          type: 'USER_JOINED',
          payload: data,
        })
      );
    });

    this.socket.on('user_left', data => {
      this.collaborators.delete(data.user_id);
      store.dispatch(
        updateCollaborationState({
          type: 'USER_LEFT',
          payload: data,
        })
      );
    });

    this.socket.on('cursor_update', data => {
      store.dispatch(
        updateCollaborationState({
          type: 'CURSOR_UPDATE',
          payload: data,
        })
      );
    });

    this.socket.on('chat_message', data => {
      store.dispatch(
        updateCollaborationState({
          type: 'CHAT_MESSAGE',
          payload: data,
        })
      );
    });

    this.socket.on('add_comment', data => {
      store.dispatch(
        updateCollaborationState({
          type: 'ADD_COMMENT',
          payload: data,
        })
      );
    });

    this.socket.on('resolve_comment', data => {
      store.dispatch(
        updateCollaborationState({
          type: 'RESOLVE_COMMENT',
          payload: data,
        })
      );
    });

    // Physics updates
    this.socket.on('physics:update', data => {
      store.dispatch(updateObjectTransform(data));
    });

    // Harmony updates
    this.socket.on('harmony:update', data => {
      store.dispatch(updateHarmonyParameters(data.parameters));
    });

    // Visualization updates
    this.socket.on('visualization:update', data => {
      store.dispatch(updateVisualizationData(data));
    });
  }

  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Room Management
  joinRoom(room) {
    this.socket?.emit('join', { room });
  }

  leaveRoom(room) {
    this.socket?.emit('leave', { room });
  }

  // Collaboration Events
  emitCursorUpdate(position) {
    this.socket?.emit('cursor_update', {
      x: position.x,
      y: position.y,
      timestamp: new Date().toISOString(),
    });
  }

  emitChatMessage(content) {
    this.socket?.emit('chat_message', {
      content,
      timestamp: new Date().toISOString(),
    });
  }

  emitComment(content, position) {
    this.socket?.emit('add_comment', {
      content,
      position,
      timestamp: new Date().toISOString(),
    });
  }

  emitResolveComment(commentId) {
    this.socket?.emit('resolve_comment', {
      comment_id: commentId,
      timestamp: new Date().toISOString(),
    });
  }

  // Universe Events
  emitPhysicsUpdate(data) {
    this.socket?.emit('physics:update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitHarmonyUpdate(data) {
    this.socket?.emit('harmony:update', {
      parameters: data,
      timestamp: new Date().toISOString(),
    });
  }

  emitVisualizationUpdate(data) {
    this.socket?.emit('visualization:update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.collaborators.clear();
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
