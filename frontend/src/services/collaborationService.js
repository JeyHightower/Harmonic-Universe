import websocketService from './websocket';

class CollaborationService {
  constructor() {
    this.activeRooms = new Map();
    this.currentRoom = null;
    this.collaborators = new Map();
    this.cursorPositions = new Map();
  }

  joinRoom(roomToken, userId, username) {
    if (this.currentRoom) {
      this.leaveRoom();
    }

    websocketService.emit('join_room', {
      room_token: roomToken,
      user_id: userId,
      username: username,
    });

    this.currentRoom = roomToken;
    this.activeRooms.set(roomToken, {
      collaborators: new Set(),
      cursors: new Map(),
    });

    // Set up room-specific handlers
    websocketService.on(
      'collaborator_joined',
      this.handleCollaboratorJoined.bind(this)
    );
    websocketService.on(
      'collaborator_left',
      this.handleCollaboratorLeft.bind(this)
    );
    websocketService.on('cursor_moved', this.handleCursorMoved.bind(this));
    websocketService.on(
      'parameter_changed',
      this.handleParameterChanged.bind(this)
    );
  }

  leaveRoom() {
    if (!this.currentRoom) return;

    websocketService.emit('leave_room', {
      room_token: this.currentRoom,
    });

    // Clean up room-specific handlers
    websocketService.off('collaborator_joined');
    websocketService.off('collaborator_left');
    websocketService.off('cursor_moved');
    websocketService.off('parameter_changed');

    this.activeRooms.delete(this.currentRoom);
    this.currentRoom = null;
  }

  updateCursorPosition(x, y, parameterType) {
    if (!this.currentRoom) return;

    websocketService.emit('cursor_moved', {
      room_token: this.currentRoom,
      position: { x, y },
      parameter_type: parameterType,
    });
  }

  updateParameter(parameterType, value) {
    if (!this.currentRoom) return;

    websocketService.emit('parameter_changed', {
      room_token: this.currentRoom,
      parameter_type: parameterType,
      value: value,
    });
  }

  handleCollaboratorJoined(data) {
    const room = this.activeRooms.get(this.currentRoom);
    if (!room) return;

    room.collaborators.add(data.user_id);
    this.collaborators.set(data.user_id, {
      username: data.username,
      color: data.color,
    });
  }

  handleCollaboratorLeft(data) {
    const room = this.activeRooms.get(this.currentRoom);
    if (!room) return;

    room.collaborators.delete(data.user_id);
    this.collaborators.delete(data.user_id);
    room.cursors.delete(data.user_id);
  }

  handleCursorMoved(data) {
    const room = this.activeRooms.get(this.currentRoom);
    if (!room) return;

    room.cursors.set(data.user_id, {
      position: data.position,
      parameterType: data.parameter_type,
    });
  }

  handleParameterChanged(data) {
    // This will be handled by the universe component
    websocketService.emit('parameter_sync', {
      room_token: this.currentRoom,
      ...data,
    });
  }

  getCollaborators() {
    const room = this.activeRooms.get(this.currentRoom);
    return room
      ? Array.from(room.collaborators).map(id => ({
          id,
          ...this.collaborators.get(id),
        }))
      : [];
  }

  getCursorPositions() {
    const room = this.activeRooms.get(this.currentRoom);
    return room ? Object.fromEntries(room.cursors) : {};
  }
}

const collaborationService = new CollaborationService();
export default collaborationService;
