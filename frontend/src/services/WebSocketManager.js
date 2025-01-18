class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
  }

  connect() {
    try {
      this.socket = new WebSocket('wss://api.harmonicuniverse.com/v1/ws');
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError();
    }
  }

  setupEventHandlers() {
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.handleConnectionError();
    };

    this.socket.onerror = error => {
      console.error('WebSocket error:', error);
    };

    this.socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectDelay *= 2; // Exponential backoff
        this.connect();
      }, this.reconnectDelay);
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'audioAnalysis':
        // Handle audio analysis data
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default WebSocketManager;
