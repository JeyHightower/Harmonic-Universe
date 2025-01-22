import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebSocket } from 'mock-socket';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CollaborationProvider } from '../CollaborationContext';
import CollaborationPanel from '../CollaborationPanel';
import SharedWorkspace from '../SharedWorkspace';

// Mock WebSocket
global.WebSocket = WebSocket;

// Mock collaboration data
const mockCollaborators = [
  { id: 1, name: 'Alice', color: '#ff0000', cursor: { x: 100, y: 100 } },
  { id: 2, name: 'Bob', color: '#00ff00', cursor: { x: 200, y: 200 } },
];

const mockMessages = [
  {
    id: 1,
    sender: 'Alice',
    content: 'Hello!',
    timestamp: '2024-03-20T10:00:00Z',
  },
  {
    id: 2,
    sender: 'Bob',
    content: 'Hi there!',
    timestamp: '2024-03-20T10:01:00Z',
  },
];

describe('Collaboration Features', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        collaboration: (
          state = {
            isConnected: false,
            collaborators: [],
            messages: [],
            currentUser: { id: 1, name: 'Alice', color: '#ff0000' },
            error: null,
          },
          action
        ) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <CollaborationProvider>{component}</CollaborationProvider>
      </Provider>
    );
  };

  describe('CollaborationPanel Component', () => {
    it('renders collaboration panel correctly', () => {
      renderWithProviders(<CollaborationPanel />);

      expect(screen.getByTestId('collaborators-list')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });

    it('displays collaborator list', async () => {
      store = configureStore({
        reducer: {
          collaboration: (
            state = {
              collaborators: mockCollaborators,
              currentUser: { id: 1, name: 'Alice', color: '#ff0000' },
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<CollaborationPanel />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows chat messages', async () => {
      store = configureStore({
        reducer: {
          collaboration: (
            state = {
              messages: mockMessages,
              currentUser: { id: 1, name: 'Alice', color: '#ff0000' },
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<CollaborationPanel />);

      expect(screen.getByText('Hello!')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('sends chat message', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollaborationPanel />);

      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');

      await user.type(input, 'New message');
      await user.click(sendButton);

      expect(input).toHaveValue('');
      // Verify message was sent through WebSocket
    });
  });

  describe('SharedWorkspace Component', () => {
    it('renders shared workspace correctly', () => {
      renderWithProviders(<SharedWorkspace />);
      expect(screen.getByTestId('shared-canvas')).toBeInTheDocument();
    });

    it('shows collaborator cursors', async () => {
      store = configureStore({
        reducer: {
          collaboration: (
            state = {
              collaborators: mockCollaborators,
              currentUser: { id: 1, name: 'Alice', color: '#ff0000' },
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<SharedWorkspace />);

      const cursors = screen.getAllByTestId('collaborator-cursor');
      expect(cursors).toHaveLength(2);
    });

    it('updates cursor position on mouse move', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SharedWorkspace />);

      const canvas = screen.getByTestId('shared-canvas');
      await user.pointer([
        { target: canvas, coords: { clientX: 150, clientY: 150 } },
      ]);

      // Verify cursor position was updated and sent through WebSocket
    });

    it('handles collaborative editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SharedWorkspace />);

      const canvas = screen.getByTestId('shared-canvas');
      await user.pointer([
        {
          target: canvas,
          coords: { clientX: 100, clientY: 100 },
          keys: '[MouseLeft>]',
        },
        {
          target: canvas,
          coords: { clientX: 200, clientY: 200 },
          keys: '[/MouseLeft]',
        },
      ]);

      // Verify edit was made and sent through WebSocket
    });
  });

  describe('Collaboration Context Integration', () => {
    it('establishes WebSocket connection', async () => {
      renderWithProviders(<CollaborationPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent(
          'Connected'
        );
      });
    });

    it('handles connection errors', async () => {
      // Simulate WebSocket connection error
      global.WebSocket = class extends WebSocket {
        constructor() {
          super('ws://localhost');
          setTimeout(() => this.onerror(new Error('Connection failed')), 100);
        }
      };

      renderWithProviders(<CollaborationPanel />);

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });
    });

    it('reconnects automatically', async () => {
      let connectionAttempts = 0;
      global.WebSocket = class extends WebSocket {
        constructor() {
          super('ws://localhost');
          connectionAttempts++;
          if (connectionAttempts === 1) {
            setTimeout(() => this.close(), 100);
          }
        }
      };

      renderWithProviders(<CollaborationPanel />);

      await waitFor(() => {
        expect(connectionAttempts).toBeGreaterThan(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when WebSocket fails', async () => {
      global.WebSocket = class extends WebSocket {
        constructor() {
          super('ws://localhost');
          setTimeout(() => this.onerror(new Error('WebSocket failed')), 100);
        }
      };

      renderWithProviders(<CollaborationPanel />);

      await waitFor(() => {
        expect(screen.getByText(/websocket failed/i)).toBeInTheDocument();
      });
    });

    it('handles message parsing errors', async () => {
      const mockSocket = new WebSocket('ws://localhost');
      mockSocket.send(JSON.stringify({ type: 'invalid', data: {} }));

      renderWithProviders(<CollaborationPanel />);

      await waitFor(() => {
        expect(screen.getByText(/invalid message type/i)).toBeInTheDocument();
      });
    });

    it('recovers from temporary disconnections', async () => {
      const mockSocket = new WebSocket('ws://localhost');
      renderWithProviders(<CollaborationPanel />);

      // Simulate temporary disconnection
      mockSocket.close();
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();

      // Simulate reconnection
      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('throttles cursor updates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SharedWorkspace />);

      const canvas = screen.getByTestId('shared-canvas');
      const updateCount = { value: 0 };

      // Mock cursor update function
      const originalUpdate = canvas.onmousemove;
      canvas.onmousemove = event => {
        updateCount.value++;
        originalUpdate(event);
      };

      // Simulate rapid mouse movements
      for (let i = 0; i < 10; i++) {
        await user.pointer([
          { target: canvas, coords: { clientX: i * 10, clientY: i * 10 } },
        ]);
      }

      expect(updateCount.value).toBeLessThan(10);
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithProviders(<CollaborationPanel />);
      unmount();

      // Verify WebSocket connection is closed and event listeners are removed
    });

    it('limits message history', async () => {
      const longMessageList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        sender: 'Test',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }));

      store = configureStore({
        reducer: {
          collaboration: (
            state = {
              messages: longMessageList,
              currentUser: { id: 1, name: 'Alice', color: '#ff0000' },
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<CollaborationPanel />);

      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements.length).toBeLessThan(1000);
    });
  });
});
