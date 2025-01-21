import pako from 'pako'; // For message compression
import io from 'socket.io-client';

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',
  HALF_OPEN: 'HALF_OPEN',
  OPEN: 'OPEN',
};

class CircuitBreaker {
  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.lastFailureTime = null;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = CIRCUIT_STATES.CLOSED;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CIRCUIT_STATES.OPEN;
      // Notify about circuit breaker state change
      const event = new CustomEvent('show-warning', {
        detail: {
          message: 'Connection Problems Detected',
          details:
            'The system is temporarily limiting connection attempts due to repeated failures.',
          category: 'CIRCUIT_BREAKER',
          duration: 7000,
        },
      });
      window.dispatchEvent(event);
    }
  }

  canMakeRequest() {
    if (this.state === CIRCUIT_STATES.CLOSED) {
      return true;
    }

    if (this.state === CIRCUIT_STATES.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        // Notify about retry attempt
        const event = new CustomEvent('show-info', {
          detail: {
            message: 'Attempting to Restore Connection',
            details: 'The system will try to re-establish a stable connection.',
            category: 'CIRCUIT_BREAKER',
            duration: 4000,
          },
        });
        window.dispatchEvent(event);
        return true;
      }
      return false;
    }

    return this.state === CIRCUIT_STATES.HALF_OPEN;
  }
}

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
    this.circuitBreaker = new CircuitBreaker();
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.heartbeatTimeout = 30000;
    this.errorCategories = {
      NETWORK: 'NETWORK',
      PROTOCOL: 'PROTOCOL',
      AUTHENTICATION: 'AUTHENTICATION',
      TIMEOUT: 'TIMEOUT',
      UNKNOWN: 'UNKNOWN',
    };

    this.retryStrategies = {
      [this.errorCategories.NETWORK]: {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
      },
      [this.errorCategories.PROTOCOL]: {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 10000,
      },
      [this.errorCategories.AUTHENTICATION]: {
        maxAttempts: 2,
        baseDelay: 5000,
        maxDelay: 15000,
      },
      [this.errorCategories.TIMEOUT]: {
        maxAttempts: 4,
        baseDelay: 2000,
        maxDelay: 20000,
      },
      [this.errorCategories.UNKNOWN]: {
        maxAttempts: 3,
        baseDelay: 3000,
        maxDelay: 15000,
      },
    };

    this.cleanupTasks = new Set();
    this.resourceTimers = new Set();
  }

  registerCleanupTask(task) {
    this.cleanupTasks.add(task);
  }

  registerTimer(timer) {
    this.resourceTimers.add(timer);
  }

  clearTimer(timer) {
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.resourceTimers.delete(timer);
    }
  }

  clearAllTimers() {
    for (const timer of this.resourceTimers) {
      this.clearTimer(timer);
    }
    this.resourceTimers.clear();
  }

  connect(url, options = {}) {
    if (!this.circuitBreaker.canMakeRequest()) {
      console.error('Circuit breaker is open, connection not allowed');
      return false;
    }

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
      this.startHeartbeat();
      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error);
      this.circuitBreaker.recordFailure();
      return false;
    }
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat

    const heartbeatInterval = setInterval(() => {
      if (!this.isConnected) return;

      try {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
        this.lastHeartbeat = Date.now();

        // Check for missed heartbeats
        const heartbeatTimeout = setTimeout(() => {
          if (Date.now() - this.lastHeartbeat > this.heartbeatTimeout) {
            this.handleHeartbeatFailure();
          }
        }, this.heartbeatTimeout);

        this.registerTimer(heartbeatTimeout);
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.handleHeartbeatFailure();
      }
    }, 15000);

    this.registerTimer(heartbeatInterval);
    this.heartbeatInterval = heartbeatInterval;
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      this.clearTimer(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleHeartbeatFailure() {
    const timeSinceLastHeartbeat = Date.now() - (this.lastHeartbeat || 0);
    if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
      // Show heartbeat failure notification
      const event = new CustomEvent('show-warning', {
        detail: {
          message: 'Connection Unstable',
          details: 'Lost connection to server. Attempting to reconnect...',
          category: 'WEBSOCKET_HEARTBEAT',
          duration: 5000,
        },
      });
      window.dispatchEvent(event);

      console.error('Heartbeat timeout, reconnecting...');
      this.circuitBreaker.recordFailure();
      this.reconnect();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Clear existing handlers
    this.socket.removeAllListeners();

    // Setup new handlers
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.circuitBreaker.recordSuccess();
      this.flushMessageQueue();
    });

    this.socket.on('disconnect', reason => {
      this.handleDisconnect(reason);
    });

    this.socket.on('error', error => {
      this.handleError(error);
    });

    this.socket.on('message_ack', data => {
      this.handleMessageAck(data);
    });

    this.socket.on('batch_update', data => {
      this.handleBatchUpdate(data);
    });

    // Register socket cleanup
    this.registerCleanupTask(() => {
      if (this.socket) {
        this.socket.removeAllListeners();
      }
    });
  }

  handleBatchUpdate(compressedData) {
    try {
      const updates = this.decompressMessage(compressedData);
      updates.forEach(update => {
        const handler = this.handlers.get(update.type);
        if (handler) {
          handler(update.data);
        }
      });
      this.circuitBreaker.recordSuccess();
    } catch (error) {
      console.error('Error processing batch update:', error);
      this.handleError(error);
      this.circuitBreaker.recordFailure();
    }
  }

  handleMessageAck({ messageId, status, error }) {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingMessages.delete(messageId);

      if (status === 'error') {
        this.handleMessageError(messageId, error);
        this.circuitBreaker.recordFailure();
      } else {
        this.circuitBreaker.recordSuccess();
      }
    }
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

  categorizeError(error) {
    if (error.message?.includes('timeout')) {
      return this.errorCategories.TIMEOUT;
    }
    if (
      error.message?.includes('unauthorized') ||
      error.message?.includes('authentication')
    ) {
      return this.errorCategories.AUTHENTICATION;
    }
    if (
      error.message?.includes('network') ||
      error.message?.includes('connection')
    ) {
      return this.errorCategories.NETWORK;
    }
    if (
      error.message?.includes('protocol') ||
      error.message?.includes('websocket')
    ) {
      return this.errorCategories.PROTOCOL;
    }
    return this.errorCategories.UNKNOWN;
  }

  async handleError(error) {
    const category = this.categorizeError(error);
    const strategy = this.retryStrategies[category];

    console.error(`WebSocket error (${category}):`, error);

    // Show error notification
    const event = new CustomEvent('show-error', {
      detail: {
        message: this.getErrorMessage(category),
        details: error.message,
        category: `WEBSOCKET_${category}`,
        duration: 5000,
      },
    });
    window.dispatchEvent(event);

    if (this.reconnectAttempts >= strategy.maxAttempts) {
      this.handleReconnectFailed();
      return;
    }

    const delay = Math.min(
      strategy.baseDelay * Math.pow(2, this.reconnectAttempts),
      strategy.maxDelay
    );

    this.reconnectAttempts++;

    // Show reconnection attempt notification
    const reconnectEvent = new CustomEvent('show-info', {
      detail: {
        message: 'Attempting to Reconnect',
        details: `Retry attempt ${this.reconnectAttempts} of ${strategy.maxAttempts}`,
        category: 'WEBSOCKET_RECONNECT',
        duration: 3000,
      },
    });
    window.dispatchEvent(reconnectEvent);

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.reconnect();

      // Show success notification
      const successEvent = new CustomEvent('show-success', {
        detail: {
          message: 'Connection Restored',
          details: 'WebSocket connection has been re-established',
          category: 'WEBSOCKET_RECONNECT',
          duration: 3000,
        },
      });
      window.dispatchEvent(successEvent);

      this.circuitBreaker.recordSuccess();
    } catch (reconnectError) {
      this.circuitBreaker.recordFailure();
      this.handleError(reconnectError);
    }
  }

  getErrorMessage(category) {
    switch (category) {
      case this.errorCategories.NETWORK:
        return 'Network Connection Error';
      case this.errorCategories.PROTOCOL:
        return 'Protocol Error';
      case this.errorCategories.AUTHENTICATION:
        return 'Authentication Failed';
      case this.errorCategories.TIMEOUT:
        return 'Connection Timeout';
      default:
        return 'Unknown Error';
    }
  }

  handleReconnectFailed() {
    const error = new Error('Maximum reconnection attempts reached');
    error.category = this.errorCategories.NETWORK;

    // Show fatal error notification
    const event = new CustomEvent('show-error', {
      detail: {
        message: 'Connection Failed',
        details:
          'Maximum reconnection attempts reached. Please try again later.',
        category: 'WEBSOCKET_FATAL',
        duration: null, // Don't auto-dismiss
      },
    });
    window.dispatchEvent(event);

    // Clear message queue and pending messages
    this.messageQueue = [];
    this.pendingMessages.clear();

    // Reset connection state
    this.isConnected = false;
    this.reconnectAttempts = 0;

    // Stop heartbeat
    this.stopHeartbeat();
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
    // Execute all cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        task();
      } catch (error) {
        console.error('Error in cleanup task:', error);
      }
    }
    this.cleanupTasks.clear();

    // Clear all timers
    this.clearAllTimers();

    // Clear message queue and pending messages
    this.messageQueue = [];
    for (const { timeout } of this.pendingMessages.values()) {
      this.clearTimer(timeout);
    }
    this.pendingMessages.clear();

    // Stop heartbeat
    this.stopHeartbeat();

    // Disconnect socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    // Reset state
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.lastHeartbeat = null;
  }

  async reconnect() {
    if (!this.circuitBreaker.canMakeRequest()) {
      throw new Error('Circuit breaker is open');
    }

    if (this.socket) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, this.options);

        this.socket.once('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupEventHandlers();
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        });

        this.socket.once('connect_error', error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
