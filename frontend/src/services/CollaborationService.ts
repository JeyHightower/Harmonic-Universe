import { websocketService } from './websocketService';

interface Presence {
  userId: string;
  username: string;
  avatar?: string;
  lastActive: Date;
  currentView: string;
  isTyping: boolean;
}

interface CollaborationState {
  activeUsers: Map<string, Presence>;
  userCursors: Map<string, { x: number; y: number }>;
}

class CollaborationService {
  private static instance: CollaborationService;
  private state: CollaborationState = {
    activeUsers: new Map(),
    userCursors: new Map(),
  };
  private listeners: Set<(state: CollaborationState) => void> = new Set();

  private constructor() {
    this.setupWebSocket();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  private setupWebSocket() {
    websocketService.on('user_joined', this.handleUserJoined);
    websocketService.on('user_left', this.handleUserLeft);
    websocketService.on('cursor_moved', this.handleCursorMoved);
    websocketService.on('user_typing', this.handleUserTyping);
  }

  private handleUserJoined = (data: { userId: string; presence: Presence }) => {
    this.state.activeUsers.set(data.userId, data.presence);
    this.notifyListeners();
  };

  private handleUserLeft = (userId: string) => {
    this.state.activeUsers.delete(userId);
    this.state.userCursors.delete(userId);
    this.notifyListeners();
  };

  private handleCursorMoved = (data: { userId: string; position: { x: number; y: number } }) => {
    this.state.userCursors.set(data.userId, data.position);
    this.notifyListeners();
  };

  private handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
    const presence = this.state.activeUsers.get(data.userId);
    if (presence) {
      presence.isTyping = data.isTyping;
      this.state.activeUsers.set(data.userId, presence);
      this.notifyListeners();
    }
  };

  public joinUniverse(universeId: string) {
    websocketService.emit('join_universe', { universeId });
  }

  public leaveUniverse(universeId: string) {
    websocketService.emit('leave_universe', { universeId });
  }

  public updateCursor(position: { x: number; y: number }) {
    websocketService.emit('cursor_moved', { position });
  }

  public setTyping(isTyping: boolean) {
    websocketService.emit('user_typing', { isTyping });
  }

  public subscribe(listener: (state: CollaborationState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public getActiveUsers(): Presence[] {
    return Array.from(this.state.activeUsers.values());
  }

  public getUserCursors(): Map<string, { x: number; y: number }> {
    return new Map(this.state.userCursors);
  }
}

export const collaborationService = CollaborationService.getInstance();
