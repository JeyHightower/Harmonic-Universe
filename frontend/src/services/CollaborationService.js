import api from './api';
import WebSocketService from './websocket';

class CollaborationService {
    constructor() {
        this.activeUniverseId = null;
        this.collaborators = new Map();
        this.activities = [];
        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        WebSocketService.on('user_joined', this.handleUserJoined.bind(this));
        WebSocketService.on('user_left', this.handleUserLeft.bind(this));
        WebSocketService.on('cursor_moved', this.handleCursorMove.bind(this));
        WebSocketService.on('user_typing', this.handleTypingStatus.bind(this));
        WebSocketService.on('new_message', this.handleNewMessage.bind(this));
    }

    async joinUniverse(universeId) {
        this.activeUniverseId = universeId;
        WebSocketService.joinUniverse(universeId);

        // Get initial state
        const [collaborators, activities] = await Promise.all([
            this.getCollaborators(universeId),
            this.getActivities(universeId)
        ]);

        this.collaborators = new Map(collaborators.map(c => [c.id, c]));
        this.activities = activities;

        return {
            collaborators: Array.from(this.collaborators.values()),
            activities: this.activities
        };
    }

    leaveUniverse() {
        if (this.activeUniverseId) {
            WebSocketService.leaveUniverse(this.activeUniverseId);
            this.activeUniverseId = null;
            this.collaborators.clear();
            this.activities = [];
        }
    }

    async getCollaborators(universeId) {
        const response = await api.get(`/universes/${universeId}/collaborators`);
        return response.data;
    }

    async getActivities(universeId) {
        const response = await api.get(`/collaboration/activity/${universeId}`);
        return response.data;
    }

    async inviteCollaborator(universeId, email, role) {
        const response = await api.post(`/universes/${universeId}/collaborators`, {
            email,
            role
        });
        return response.data;
    }

    async removeCollaborator(universeId, userId) {
        await api.delete(`/universes/${universeId}/collaborators/${userId}`);
        this.collaborators.delete(userId);
        return Array.from(this.collaborators.values());
    }

    async updatePermissions(universeId, userId, permissions) {
        const response = await api.put(`/universes/${universeId}/collaborators/${userId}`, {
            permissions
        });
        const updatedCollaborator = response.data;
        this.collaborators.set(userId, updatedCollaborator);
        return Array.from(this.collaborators.values());
    }

    updateCursorPosition(position) {
        if (this.activeUniverseId) {
            WebSocketService.updateCursor(this.activeUniverseId, position);
        }
    }

    sendChatMessage(message) {
        if (this.activeUniverseId) {
            WebSocketService.sendChatMessage(this.activeUniverseId, message);
        }
    }

    // WebSocket event handlers
    handleUserJoined(data) {
        const { userId, presence } = data;
        this.collaborators.set(userId, presence);
        this.notifyListeners('collaboratorsChanged', Array.from(this.collaborators.values()));
    }

    handleUserLeft(data) {
        const { userId } = data;
        this.collaborators.delete(userId);
        this.notifyListeners('collaboratorsChanged', Array.from(this.collaborators.values()));
    }

    handleCursorMove(data) {
        const { userId, position } = data;
        const collaborator = this.collaborators.get(userId);
        if (collaborator) {
            collaborator.cursorPosition = position;
            this.notifyListeners('cursorMoved', { userId, position });
        }
    }

    handleTypingStatus(data) {
        const { userId, isTyping } = data;
        const collaborator = this.collaborators.get(userId);
        if (collaborator) {
            collaborator.isTyping = isTyping;
            this.notifyListeners('typingStatusChanged', { userId, isTyping });
        }
    }

    handleNewMessage(data) {
        this.activities.unshift(data);
        this.notifyListeners('newMessage', data);
    }

    // Event listener management
    listeners = new Map();

    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    removeListener(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    notifyListeners(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
}

export default new CollaborationService();
