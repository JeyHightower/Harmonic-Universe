import { updateObjectTransform } from '@/store/slices/physicsSlice';
import { updateHarmonyParameters } from '@/store/slices/universeSlice';
import { updateVisualizationData } from '@/store/slices/visualizationSlice';
import { store } from '@/store/store';
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

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

  private setupEventHandlers() {
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
    this.socket.on(
      'physics:update',
      (data: { objectId: number; position: number[]; rotation: number[] }) => {
        store.dispatch(updateObjectTransform(data));
      }
    );

    // Harmony updates
    this.socket.on('harmony:update', (data: { universeId: number; parameters: any }) => {
      store.dispatch(updateHarmonyParameters(data.parameters));
    });

    // Visualization updates
    this.socket.on('visualization:update', (data: { id: number; data: any }) => {
      store.dispatch(updateVisualizationData(data));
    });
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  joinRoom(room: string) {
    this.socket?.emit('join', room);
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave', room);
  }

  emitPhysicsUpdate(data: { objectId: number; position: number[]; rotation: number[] }) {
    this.socket?.emit('physics:update', data);
  }

  emitHarmonyUpdate(data: { universeId: number; parameters: any }) {
    this.socket?.emit('harmony:update', data);
  }

  emitVisualizationUpdate(data: { id: number; data: any }) {
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
