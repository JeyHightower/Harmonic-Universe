import { waitFor } from '@testing-library/react';
import WS from 'jest-websocket-mock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import WebSocketClient from '../../services/WebSocketClient';
import {
  addParticipant,
  removeParticipant,
  setConnectionStatus,
  setCurrentRoom,
  setError,
  setMusicData,
  setVisualizationData,
  updateParameters,
} from '../../store/actions/websocket';

const mockStore = configureMockStore([thunk]);

describe('WebSocketClient', () => {
  let ws;
  let client;
  let store;

  beforeEach(() => {
    // Create mock WebSocket server
    ws = new WS('ws://localhost:5002');

    // Create mock store
    store = mockStore({
      websocket: {
        connected: false,
        currentRoom: null,
        error: null,
        participants: {},
        parameters: {
          physics: {},
          music: {},
          visualization: {},
        },
        musicData: null,
        visualizationData: null,
      },
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');

    client = new WebSocketClient(store);
  });

  afterEach(() => {
    WS.clean();
    client.disconnect();
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('connects successfully', async () => {
      client.connect();
      await waitFor(() => {
        expect(ws.connected).toBe(true);
        expect(localStorage.getItem).toHaveBeenCalledWith('token');
      });

      // Simulate successful connection
      ws.send(
        JSON.stringify({ type: 'connect_success', user_id: 'test-user' })
      );

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setConnectionStatus(true));
      });
    });

    test('handles connection failure', async () => {
      ws.close();
      client.connect();
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(
          expect.objectContaining({
            type: 'SET_ERROR',
            payload: expect.stringContaining('error'),
          })
        );
      });
    });

    test('implements reconnection logic', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      ws.close();
      await waitFor(() => expect(ws.connected).toBe(false));

      // Server comes back online
      ws = new WS('ws://localhost:5002');
      await waitFor(() => expect(ws.connected).toBe(true));
    });
  });

  describe('Room Management', () => {
    test('joins collaboration room', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const roomData = {
        id: 'test-room',
        universe_id: 1,
        owner_id: 'test-user',
        max_participants: 5,
        mode: 'view',
        participant_count: 1,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      client.joinRoom('test-room', 1, 'view');
      await waitFor(() => {
        expect(ws).toReceiveMessage(
          expect.objectContaining({
            type: 'join_room',
            room_id: 'test-room',
            universe_id: 1,
            mode: 'view',
          })
        );
      });

      // Simulate room joined response
      ws.send(JSON.stringify({ type: 'room_joined', room: roomData }));

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setCurrentRoom(roomData));
      });
    });

    test('leaves room properly', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      client.joinRoom('test-room');
      client.leaveRoom('test-room');

      await waitFor(() => {
        expect(ws).toReceiveMessage(
          expect.objectContaining({
            type: 'leave_room',
            room_id: 'test-room',
          })
        );
      });

      // Simulate room left response
      ws.send(JSON.stringify({ type: 'room_left', room_id: 'test-room' }));

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setCurrentRoom(null));
      });
    });
  });

  describe('Parameter Updates', () => {
    test('sends parameter updates', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const params = {
        physics: { gravity: 9.81 },
        music: { tempo: 120 },
        visualization: { brightness: 0.8 },
      };

      client.updateParameters(params);
      await waitFor(() => {
        expect(ws).toReceiveMessage(
          expect.objectContaining({
            type: 'parameter_update',
            parameters: params,
          })
        );
      });
    });

    test('receives parameter updates', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const update = {
        type: 'parameter_update',
        parameters: {
          physics: { gravity: 9.81 },
          music: { tempo: 120 },
          visualization: { brightness: 0.8 },
        },
      };

      ws.send(JSON.stringify(update));
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(updateParameters(update.parameters));
      });
    });
  });

  describe('Music Generation', () => {
    test('requests music generation', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      client.requestMusicGeneration(30, 0);
      await waitFor(() => {
        expect(ws).toReceiveMessage(
          expect.objectContaining({
            type: 'music_generation',
            duration: 30,
            start_time: 0,
          })
        );
      });
    });

    test('receives music updates', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const musicData = {
        type: 'music_update',
        notes: [
          { pitch: 60, start: 0, duration: 0.5, velocity: 100 },
          { pitch: 64, start: 0.5, duration: 0.5, velocity: 100 },
        ],
      };

      ws.send(JSON.stringify(musicData));
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setMusicData(musicData));
      });
    });
  });

  describe('Visualization Updates', () => {
    test('requests visualization updates', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      client.requestVisualizationUpdate(800, 600, 'high');
      await waitFor(() => {
        expect(ws).toReceiveMessage(
          expect.objectContaining({
            type: 'visualization_update',
            width: 800,
            height: 600,
            quality: 'high',
          })
        );
      });
    });

    test('receives visualization updates', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const visualData = {
        type: 'visualization_update',
        particles: [
          { x: 0, y: 0, size: 10, color: '#ff0000' },
          { x: 100, y: 100, size: 5, color: '#00ff00' },
        ],
      };

      ws.send(JSON.stringify(visualData));
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setVisualizationData(visualData));
      });
    });
  });

  describe('Participant Management', () => {
    test('handles participant joining', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      const participant = {
        user_id: 'test-user',
        username: 'Test User',
        joined_at: new Date().toISOString(),
      };

      ws.send(JSON.stringify({ type: 'participant_joined', ...participant }));
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(addParticipant(participant));
      });
    });

    test('handles participant leaving', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      ws.send(
        JSON.stringify({
          type: 'participant_left',
          user_id: 'test-user',
        })
      );

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(removeParticipant('test-user'));
      });
    });
  });

  describe('Error Handling', () => {
    test('handles invalid messages', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      ws.send('invalid json');
      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(
          expect.objectContaining({
            type: 'SET_ERROR',
            payload: expect.stringContaining('parse'),
          })
        );
      });
    });

    test('handles server errors', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Server error',
        })
      );

      await waitFor(() => {
        const actions = store.getActions();
        expect(actions).toContainEqual(setError('Server error'));
      });
    });
  });

  describe('Cleanup', () => {
    test('cleans up on unmount', async () => {
      client.connect();
      await waitFor(() => expect(ws.connected).toBe(true));

      client.disconnect();
      await waitFor(() => {
        expect(ws.connected).toBe(false);
        const actions = store.getActions();
        expect(actions).toContainEqual(setConnectionStatus(false));
      });
    });
  });
});
