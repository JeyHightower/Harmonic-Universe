import { io } from 'socket.io-client';
import { logError } from '../../services/errorLogging';
import WebSocketService from '../../services/websocket';

jest.mock('socket.io-client');
jest.mock('../../services/errorLogging');

describe('WebSocketService', () => {
  let mockSocket;
  let service;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    io.mockReturnValue(mockSocket);
    service = new WebSocketService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.disconnect();
  });

  describe('Connection Management', () => {
    it('connects successfully', () => {
      const url = 'ws://localhost:5000';
      const result = service.connect(url);

      expect(result).toBe(true);
      expect(io).toHaveBeenCalledWith(url, expect.any(Object));
    });

    it('handles connection errors', () => {
      io.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = service.connect('ws://localhost:5000');

      expect(result).toBe(false);
      expect(logError).toHaveBeenCalled();
    });

    it('respects circuit breaker when too many failures occur', () => {
      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        io.mockImplementation(() => {
          throw new Error('Connection failed');
        });
        service.connect('ws://localhost:5000');
      }

      // Next attempt should be blocked by circuit breaker
      const result = service.connect('ws://localhost:5000');
      expect(result).toBe(false);
      expect(io).toHaveBeenCalledTimes(5); // Circuit breaker should prevent the 6th attempt
    });

    it('handles reconnection with exponential backoff', () => {
      jest.useFakeTimers();

      // Simulate disconnect
      service.connect('ws://localhost:5000');
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];
      disconnectHandler('io server disconnect');

      // Check that reconnection is attempted with increasing delays
      jest.advanceTimersByTime(1000);
      expect(io).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(2000);
      expect(io).toHaveBeenCalledTimes(3);

      jest.advanceTimersByTime(4000);
      expect(io).toHaveBeenCalledTimes(4);

      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      service.connect('ws://localhost:5000');
      mockSocket.connected = true;
      service.isConnected = true;
    });

    it('compresses messages above threshold', async () => {
      const largeMessage = 'x'.repeat(2000);
      await service.emit('test', { data: largeMessage });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          compressed: true,
        })
      );
    });

    it('queues messages when disconnected', async () => {
      service.isConnected = false;
      await service.emit('test', { data: 'test' });

      expect(service.messageQueue.length).toBe(1);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('handles message timeouts', async () => {
      jest.useFakeTimers();

      const messagePromise = service.emit('test', { data: 'test' });
      jest.advanceTimersByTime(6000); // Exceed message timeout

      await expect(messagePromise).rejects.toThrow('Message timeout');

      jest.useRealTimers();
    });

    it('processes message queue on reconnection', () => {
      service.isConnected = false;
      service.emit('test1', { data: 'test1' });
      service.emit('test2', { data: 'test2' });

      // Simulate reconnection
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      connectHandler();

      expect(mockSocket.emit).toHaveBeenCalledTimes(3); // Including client_ready event
    });
  });

  describe('Heartbeat Mechanism', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      service.connect('ws://localhost:5000');
      mockSocket.connected = true;
      service.isConnected = true;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sends heartbeat at regular intervals', () => {
      jest.advanceTimersByTime(10000); // One-third of heartbeat timeout

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'heartbeat',
        expect.any(Object)
      );
    });

    it('handles heartbeat failures', () => {
      // Simulate a failed heartbeat
      jest.advanceTimersByTime(31000); // Exceed heartbeat timeout

      expect(logError).toHaveBeenCalled();
      expect(service.isConnected).toBe(false);
    });

    it('resets heartbeat on successful response', () => {
      const heartbeatAckHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'heartbeat_ack'
      )[1];

      jest.advanceTimersByTime(10000);
      heartbeatAckHandler({ timestamp: Date.now() });

      expect(service.lastHeartbeat).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service.connect('ws://localhost:5000');
    });

    it('handles batch update errors', () => {
      const batchUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'batch_update'
      )[1];

      batchUpdateHandler({ compressed: true, data: 'invalid data' });

      expect(logError).toHaveBeenCalled();
    });

    it('handles message acknowledgment errors', () => {
      const messageAckHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'message_ack'
      )[1];

      messageAckHandler({
        messageId: '123',
        status: 'error',
        error: 'Test error',
      });

      expect(logError).toHaveBeenCalled();
    });

    it('cleans up resources on disconnect', () => {
      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isConnected).toBe(false);
      expect(service.messageQueue).toHaveLength(0);
      expect(service.handlers.size).toBe(0);
      expect(service.pendingMessages.size).toBe(0);
    });
  });
});
