import { act, renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useUniverseSocket } from '../../hooks/useUniverseSocket';

// Mock dependencies
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

describe('useUniverseSocket', () => {
  let mockSocket: any;
  const mockToken = 'mock-token';
  const universeId = 1;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock socket.io-client
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      close: jest.fn(),
      connected: true,
    };
    (io as jest.Mock).mockReturnValue(mockSocket);

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({ token: mockToken });
  });

  it('initializes socket connection with correct parameters', () => {
    renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    expect(io).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: mockToken },
      transports: ['websocket'],
    });
  });

  it('joins universe on connection', () => {
    renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    // Find and execute the connect handler
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )[1];
    act(() => {
      connectHandler();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join_universe', {
      universe_id: universeId,
      current_view: expect.any(String),
    });
  });

  it('handles universe state updates', () => {
    const { result } = renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    const mockState = {
      active_users: [
        {
          id: 1,
          username: 'Test User',
          current_view: '/test',
          cursor_position: null,
          last_updated: new Date().toISOString(),
        },
      ],
      physics_parameters: {
        gravity: 9.81,
        time_dilation: 1.0,
        space_curvature: 0.0,
        field_strength: 1.0,
      },
    };

    // Find and execute the universe_state handler
    const stateHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'universe_state'
    )[1];
    act(() => {
      stateHandler(mockState);
    });

    expect(result.current.state.activeUsers).toHaveLength(1);
    expect(result.current.state.physicsParameters).toBeDefined();
  });

  it('calls onUserJoined when user joins', () => {
    const onUserJoined = jest.fn();
    renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined,
        onUserLeft: jest.fn(),
      })
    );

    const mockUser = {
      user: { id: 1, username: 'Test User' },
      current_view: '/test',
    };

    // Find and execute the user_joined handler
    const joinHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'user_joined'
    )[1];
    act(() => {
      joinHandler(mockUser);
    });

    expect(onUserJoined).toHaveBeenCalledWith(mockUser.user);
  });

  it('calls onUserLeft when user leaves', () => {
    const onUserLeft = jest.fn();
    renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft,
      })
    );

    // Find and execute the user_left handler
    const leaveHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'user_left'
    )[1];
    act(() => {
      leaveHandler({ user_id: 1 });
    });

    expect(onUserLeft).toHaveBeenCalledWith(1);
  });

  it('updates physics parameters', () => {
    const { result } = renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    act(() => {
      result.current.updatePhysics({
        gravity: 15.0,
        timeDilation: 2.0,
      });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('update_physics', {
      universe_id: universeId,
      parameters: {
        gravity: 15.0,
        timeDilation: 2.0,
      },
    });
  });

  it('updates presence', () => {
    const { result } = renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    act(() => {
      result.current.updatePresence('/new-view', { x: 100, y: 100 });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('update_presence', {
      universe_id: universeId,
      current_view: '/new-view',
      cursor_position: { x: 100, y: 100 },
    });
  });

  it('cleans up socket connection on unmount', () => {
    const { unmount } = renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
      })
    );

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave_universe', {
      universe_id: universeId,
    });
    expect(mockSocket.close).toHaveBeenCalled();
  });

  it('handles connection errors', () => {
    const onError = jest.fn();
    renderHook(() =>
      useUniverseSocket({
        universeId,
        onUserJoined: jest.fn(),
        onUserLeft: jest.fn(),
        onError,
      })
    );

    const mockError = { message: 'Connection failed' };

    // Find and execute the error handler
    const errorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'error'
    )[1];
    act(() => {
      errorHandler(mockError);
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useUniverseSocket());

    expect(result.current.state).toBeDefined();
    expect(result.current.state.id).toBe(0);
    expect(result.current.state.name).toBe('');
    expect(result.current.state.description).toBe('');
    expect(result.current.state.isPublic).toBe(true);
    expect(result.current.state.collaborators).toEqual([]);
    expect(result.current.state.musicParameters).toBeDefined();
    expect(result.current.state.visualParameters).toBeDefined();
  });

  // Add more tests as needed
});
