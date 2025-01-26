import { io } from 'socket.io-client';
import { store } from '../store';
import {
    addCollaborator,
    deleteUniverse,
    removeCollaborator,
    updateUniverseParameters
} from '../store/slices/universeSlice';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect(token) {
        if (this.socket) {
            return;
        }

        this.socket = io(import.meta.env.VITE_API_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true
        });

        this.setupEventHandlers();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('WebSocket disconnected');
        });

        this.socket.on('parameters_updated', (data) => {
            store.dispatch(updateUniverseParameters(data));
        });

        this.socket.on('collaborator_added', (data) => {
            store.dispatch(addCollaborator(data));
        });

        this.socket.on('collaborator_removed', (data) => {
            store.dispatch(removeCollaborator(data));
        });

        this.socket.on('universe_deleted', (data) => {
            store.dispatch(deleteUniverse(data.id));
        });
    }

    joinUniverse(universeId) {
        if (this.connected) {
            this.socket.emit('join_universe', { universe_id: universeId });
        }
    }

    leaveUniverse(universeId) {
        if (this.connected) {
            this.socket.emit('leave_universe', { universe_id: universeId });
        }
    }

    startSimulation(universeId) {
        if (this.connected) {
            this.socket.emit('start_simulation', { universe_id: universeId });
        }
    }

    stopSimulation(universeId) {
        if (this.connected) {
            this.socket.emit('stop_simulation', { universe_id: universeId });
        }
    }

    resetSimulation(universeId) {
        if (this.connected) {
            this.socket.emit('reset_simulation', { universe_id: universeId });
        }
    }

    updateParameters(universeId, type, parameters) {
        if (this.connected) {
            this.socket.emit('parameter_update', {
                universe_id: universeId,
                type,
                parameters
            });
        }
    }
}

export default new WebSocketService();
