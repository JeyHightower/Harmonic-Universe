import { updateObjectTransform } from '@/store/slices/physicsSlice';
import { updateHarmonyParameters } from '@/store/slices/universeSlice';
import { updateVisualizationData } from '@/store/slices/visualizationSlice';
import { store } from '@/store/store';
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

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

  joinRoom(room) {
    this.socket?.emit('join', room);
  }

  leaveRoom(room) {
    this.socket?.emit('leave', room);
  }

  emitPhysicsUpdate(data) {
    this.socket?.emit('physics:update', data);
  }

  emitHarmonyUpdate(data) {
    this.socket?.emit('harmony:update', data);
  }

  emitVisualizationUpdate(data) {
    this.socket?.emit('visualization:update', data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
