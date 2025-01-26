import io from 'socket.io-client';
import { store } from '../store';
import {
  setSimulationStatus,
  updateParameters,
} from '../store/slices/universeSlice';

class WebSocketService {
  static instance = null;
  socket = null;
  connected = false;
  eventHandlers = new Map();
  currentUniverse = null;

  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
  }

  connect() {
    if (this.socket) return;

    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.emit('client_connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      if (this.eventHandlers.has('disconnect')) {
        this.eventHandlers.get('disconnect')();
      }
    });

    this.socket.on('parameters_updated', data => {
      store.dispatch(
        updateParameters({ type: data.type, parameters: data.parameters })
      );
      if (this.eventHandlers.has('parameters_updated')) {
        this.eventHandlers.get('parameters_updated')(data);
      }
    });

    this.socket.on('simulation_started', data => {
      store.dispatch(
        setSimulationStatus({
          status: 'running',
          triggeredBy: data.triggered_by,
        })
      );
      if (this.eventHandlers.has('simulation_started')) {
        this.eventHandlers.get('simulation_started')(data);
      }
    });

    this.socket.on('simulation_stopped', data => {
      store.dispatch(
        setSimulationStatus({
          status: 'stopped',
          triggeredBy: data.triggered_by,
        })
      );
      if (this.eventHandlers.has('simulation_stopped')) {
        this.eventHandlers.get('simulation_stopped')(data);
      }
    });

    this.socket.on('simulation_reset', data => {
      store.dispatch(
        setSimulationStatus({ status: 'reset', triggeredBy: data.triggered_by })
      );
      if (this.eventHandlers.has('simulation_reset')) {
        this.eventHandlers.get('simulation_reset')(data);
      }
    });

    this.socket.on('user_joined', data => {
      if (this.eventHandlers.has('user_joined')) {
        this.eventHandlers.get('user_joined')(data);
      }
    });

    this.socket.on('user_left', data => {
      if (this.eventHandlers.has('user_left')) {
        this.eventHandlers.get('user_left')(data);
      }
    });

    this.socket.on('music_updated', data => {
      if (this.eventHandlers.has('music_updated')) {
        this.eventHandlers.get('music_updated')(data);
      }
    });

    this.socket.on('visualization_updated', data => {
      if (this.eventHandlers.has('visualization_updated')) {
        this.eventHandlers.get('visualization_updated')(data);
      }
    });

    this.socket.on('error', data => {
      console.error('WebSocket error:', data.message);
      if (this.eventHandlers.has('error')) {
        this.eventHandlers.get('error')(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinUniverse(universeId) {
    if (!this.connected) return;
    this.currentUniverse = universeId;
    this.socket.emit('join_universe', { universe_id: universeId });
  }

  leaveUniverse(universeId) {
    if (!this.connected) return;
    this.currentUniverse = null;
    this.socket.emit('leave_universe', { universe_id: universeId });
  }

  updateParameters(universeId, type, parameters) {
    if (!this.connected) return;
    this.socket.emit('update_parameters', {
      universe_id: universeId,
      type: type,
      parameters: parameters,
    });
  }

  startSimulation(universeId) {
    if (!this.connected) return;
    this.socket.emit('start_simulation', { universe_id: universeId });
  }

  stopSimulation(universeId) {
    if (!this.connected) return;
    this.socket.emit('stop_simulation', { universe_id: universeId });
  }

  resetSimulation(universeId) {
    if (!this.connected) return;
    this.socket.emit('reset_simulation', { universe_id: universeId });
  }

  on(event, handler) {
    this.eventHandlers.set(event, handler);
  }

  off(event) {
    this.eventHandlers.delete(event);
  }

  emit(event, data) {
    if (!this.connected) return;
    this.socket.emit(event, data);
  }
}

export default new WebSocketService();
