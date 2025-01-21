import pako from 'pako'; // For message compression
import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageQueue = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.batchTimeout = null;
    this.handlers = new Map();
    this.pendingMessages = new Map();
    this.messageTimeout = 5000; // 5 seconds timeout for messages
    this.compressionThreshold = 1024; // Compress messages larger than 1KB
  }

  connect(url, options = {}) {
    if (this.socket) {
      this.disconnect();
    }

    try {
      this.socket = io(url, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 10000,
        ...options,
      });

      this.setupEventHandlers();
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error);
      return false;
    }
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
      this.emit('client_ready', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.handleDisconnect(reason);
    });

    this.socket.on('error', this.handleError.bind(this));

    this.socket.on('connect_error', error => {
      console.error('Connection error:', error);
      this.handleError(error);
    });

    this.socket.on('reconnect_attempt', attemptNumber => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.handleReconnectFailed();
    });

    // Handle batch updates with decompression
    this.socket.on('batch_update', compressedData => {
      try {
        const updates = this.decompressMessage(compressedData);
        updates.forEach(update => {
          const handler = this.handlers.get(update.type);
          if (handler) {
            handler(update.data);
          }
        });
      } catch (error) {
        console.error('Error processing batch update:', error);
        this.handleError(error);
      }
    });

    // Handle message acknowledgments
    this.socket.on('message_ack', ({ messageId, status, error }) => {
      const pending = this.pendingMessages.get(messageId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(messageId);

        if (status === 'error') {
          this.handleMessageError(messageId, error);
        }
      }
    });
  }

  handleDisconnect(reason) {
    if (reason === 'io server disconnect') {
      // Server disconnected, attempt reconnection
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
    // Clear pending messages on disconnect
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('WebSocket disconnected'));
    });
    this.pendingMessages.clear();
  }

  handleError(error) {
    console.error('WebSocket error:', error);
    // Notify error handlers
    const errorHandler = this.handlers.get('error');
    if (errorHandler) {
      errorHandler(error);
    }
  }

  handleReconnectFailed() {
    const error = new Error('Maximum reconnection attempts reached');
    this.handleError(error);
    // Clear message queue
    this.messageQueue = [];
    this.pendingMessages.clear();
  }

  handleMessageError(messageId, error) {
    console.error(`Message ${messageId} failed:`, error);
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      pending.reject(error);
      this.pendingMessages.delete(messageId);
    }
  }

  compressMessage(data) {
    const jsonString = JSON.stringify(data);
    if (jsonString.length < this.compressionThreshold) {
      return { compressed: false, data };
    }
    const compressed = pako.deflate(jsonString);
    return { compressed: true, data: compressed };
  }

  decompressMessage(data) {
    if (!data.compressed) {
      return data.data;
    }
    const decompressed = pako.inflate(data.data, { to: 'string' });
    return JSON.parse(decompressed);
  }

  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        this.queueMessage(event, data, resolve, reject);
        return;
      }

      const messageId =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      const timeout = setTimeout(() => {
        this.handleMessageError(messageId, new Error('Message timeout'));
      }, this.messageTimeout);

      this.pendingMessages.set(messageId, { resolve, reject, timeout });

      try {
        const { compressed, data: processedData } = this.compressMessage(data);
        this.socket.emit(event, { messageId, compressed, data: processedData });
      } catch (error) {
        this.handleMessageError(messageId, error);
      }
    });
  }

  queueMessage(event, data, resolve, reject) {
    this.messageQueue.push({ event, data, resolve, reject });

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushMessageQueue(), 100);
    }
  }

  async flushMessageQueue() {
    if (this.messageQueue.length === 0 || !this.isConnected) {
      return;
    }

    const batch = this.messageQueue.splice(0, 10);
    const { compressed, data } = this.compressMessage(batch);

    try {
      await this.emit('batch_update', { compressed, data });
      batch.forEach(({ resolve }) => resolve());
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }

    if (this.messageQueue.length > 0) {
      this.batchTimeout = setTimeout(() => this.flushMessageQueue(), 100);
    } else {
      this.batchTimeout = null;
    }
  }

  on(event, handler) {
    this.handlers.set(event, handler);
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    this.handlers.delete(event);
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.messageQueue = [];
      this.handlers.clear();
      this.pendingMessages.clear();
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
