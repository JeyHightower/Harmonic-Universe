import { render, screen, waitFor } from '@testing-library/react';
import WS from 'jest-websocket-mock';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import AudioWorkspace from '../../components/Audio/AudioWorkspace';
import WebSocketManager from '../../services/WebSocketManager';

const mockStore = configureMockStore()({
  audio: {
    frequencies: { bass: 0, mid: 0, high: 0 },
    isPlaying: false,
  },
  physics: {
    particles: [],
    lastUpdate: null,
  },
});

describe('WebSocket Events', () => {
  let ws;
  let wsManager;

  beforeEach(() => {
    // Create a mock WebSocket server
    ws = new WS('wss://api.harmonicuniverse.com/v1/ws');
    wsManager = new WebSocketManager();
  });

  afterEach(() => {
    WS.clean();
  });

  describe('Connection Management', () => {
    test('establishes connection successfully', async () => {
      render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      await waitFor(() => {
        expect(ws.connected).toBe(true);
      });
    });

    test('handles connection failure gracefully', async () => {
      ws.close();
      render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Connection lost/i)).toBeInTheDocument();
      });
    });
  });

  describe('Audio Analysis Stream', () => {
    test('receives and processes audio analysis data', async () => {
      render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      const audioData = {
        type: 'audioAnalysis',
        data: {
          frequencies: {
            bass: 0.5,
            mid: 0.3,
            high: 0.2,
          },
          time: Date.now(),
        },
      };

      await waitFor(() => expect(ws.connected).toBe(true));
      ws.send(JSON.stringify(audioData));

      await waitFor(() => {
        const state = mockStore.getState();
        expect(state.audio.frequencies).toEqual(audioData.data.frequencies);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles invalid message types', async () => {
      render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      const invalidData = {
        type: 'invalidType',
        data: {},
      };

      await waitFor(() => expect(ws.connected).toBe(true));
      ws.send(JSON.stringify(invalidData));

      await waitFor(() => {
        expect(screen.getByText(/Unknown message type/i)).toBeInTheDocument();
      });
    });

    test('handles message parsing errors', async () => {
      render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      await waitFor(() => expect(ws.connected).toBe(true));
      ws.send('invalid json');

      await waitFor(() => {
        expect(screen.getByText(/Message parsing error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Resource Management', () => {
    test('cleans up resources on unmount', async () => {
      const { unmount } = render(
        <Provider store={mockStore}>
          <AudioWorkspace />
        </Provider>
      );

      await waitFor(() => expect(ws.connected).toBe(true));
      unmount();

      // Verify WebSocket is closed
      await waitFor(() => {
        expect(ws.connected).toBe(false);
      });
    });
  });
});
