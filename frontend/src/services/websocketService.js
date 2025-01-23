class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL}/ws?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    };

    this.socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        this.emit(type, payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('connection', { status: 'disconnected' });
      this.handleReconnect(token);
    };

    this.socket.onerror = error => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  handleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect(token), delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  send(type, payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Universe-specific methods
  joinUniverse(universeId) {
    this.send('join_universe', { universe_id: universeId });
  }

  leaveUniverse(universeId) {
    this.send('leave_universe', { universe_id: universeId });
  }

  updateParameter(universeId, paramType, value) {
    this.send('update_parameter', {
      universe_id: universeId,
      type: paramType,
      value,
    });
  }

  // Collaboration methods
  updatePresence(universeId, status) {
    this.send('presence', {
      universe_id: universeId,
      status,
    });
  }

  sendMessage(universeId, message) {
    this.send('chat_message', {
      universe_id: universeId,
      message,
    });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
