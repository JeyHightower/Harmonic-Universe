import { io } from 'socket.io-client';
import { WebSocketService } from '../../services/websocket';

jest.mock('socket.io-client');

describe('WebSocketService', () => {
  let webSocketService;
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    };

    io.mockReturnValue(mockSocket);
    webSocketService = new WebSocketService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    test('establishes socket connection with token', () => {
      const token = 'test-token';
      webSocketService.connect(token);

      expect(io).toHaveBeenCalledWith(expect.any(String), {
        auth: { token },
        transports: ['websocket']
      });
    });

    test('sets up reconnection handling', () => {
      webSocketService.connect('test-token');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    test('closes socket connection', () => {
      webSocketService.connect('test-token');
      webSocketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('joinUniverse', () => {
    test('emits join_universe event', () => {
      const universeId = '123';
      webSocketService.connect('test-token');
      webSocketService.joinUniverse(universeId);

      expect(mockSocket.emit).toHaveBeenCalledWith('join_universe', { universeId });
    });

    test('sets up universe event listeners', () => {
      const universeId = '123';
      webSocketService.connect('test-token');
      webSocketService.joinUniverse(universeId);

      expect(mockSocket.on).toHaveBeenCalledWith('parameter_updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('presence_update', expect.any(Function));
    });
  });

  describe('leaveUniverse', () => {
    test('emits leave_universe event', () => {
      const universeId = '123';
      webSocketService.connect('test-token');
      webSocketService.leaveUniverse(universeId);

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_universe', { universeId });
    });

    test('removes universe event listeners', () => {
      const universeId = '123';
      webSocketService.connect('test-token');
      webSocketService.leaveUniverse(universeId);

      expect(mockSocket.off).toHaveBeenCalledWith('parameter_updated');
      expect(mockSocket.off).toHaveBeenCalledWith('presence_update');
    });
  });

  describe('updateParameter', () => {
    test('emits parameter_update event', () => {
      const universeId = '123';
      const parameter = { name: 'test', value: 42 };
      webSocketService.connect('test-token');
      webSocketService.updateParameter(universeId, parameter);

      expect(mockSocket.emit).toHaveBeenCalledWith('parameter_update', {
        universeId,
        parameter
      });
    });
  });

  describe('on', () => {
    test('registers event listener', () => {
      const event = 'test_event';
      const callback = jest.fn();
      webSocketService.connect('test-token');
      webSocketService.on(event, callback);

      expect(mockSocket.on).toHaveBeenCalledWith(event, callback);
    });
  });

  describe('off', () => {
    test('removes event listener', () => {
      const event = 'test_event';
      const callback = jest.fn();
      webSocketService.connect('test-token');
      webSocketService.off(event, callback);

      expect(mockSocket.off).toHaveBeenCalledWith(event, callback);
    });
  });

  describe('error handling', () => {
    test('handles connection errors', () => {
      const errorCallback = jest.fn();
      webSocketService.on('error', errorCallback);
      webSocketService.connect('test-token');

      const error = new Error('Connection failed');
      mockSocket.on.mock.calls.find(call => call[0] === 'error')[1](error);

      expect(errorCallback).toHaveBeenCalledWith(error);
    });

    test('handles disconnection', () => {
      const disconnectCallback = jest.fn();
      webSocketService.on('disconnect', disconnectCallback);
      webSocketService.connect('test-token');

      mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1]();

      expect(disconnectCallback).toHaveBeenCalled();
    });
  });

  describe('reconnection', () => {
    test('attempts to reconnect on disconnect', () => {
      jest.useFakeTimers();
      webSocketService.connect('test-token');

      mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1]();
      jest.runAllTimers();

      expect(mockSocket.connect).toHaveBeenCalled();
      jest.useRealTimers();
    });

    test('emits reconnect event on successful reconnection', () => {
      const reconnectCallback = jest.fn();
      webSocketService.on('reconnect', reconnectCallback);
      webSocketService.connect('test-token');

      mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]();

      expect(reconnectCallback).toHaveBeenCalled();
    });
  });
});
