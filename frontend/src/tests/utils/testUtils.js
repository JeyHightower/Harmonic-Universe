import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// Mock initial state
export const defaultMockState = {
  auth: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  universe: {
    currentUniverse: null,
    universes: [],
    loading: false,
    error: null,
  },
  audio: {
    isPlaying: false,
    volume: 0.5,
    currentTime: 0,
    duration: 0,
    error: null,
  },
  physics: {
    isSimulating: false,
    parameters: {
      gravity: 9.81,
      friction: 0.5,
      elasticity: 0.7,
    },
    error: null,
  },
};

// Create a test store with optional preloaded state
export const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = defaultMockState.auth, action) => state,
      universe: (state = defaultMockState.universe, action) => state,
      audio: (state = defaultMockState.audio, action) => state,
      physics: (state = defaultMockState.physics, action) => state,
    },
    preloadedState,
  });
};

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    route = '/',
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Custom render with memory router for testing routes
export const renderWithMemoryRouter = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock data generators
export const createMockUniverse = (overrides = {}) => ({
  id: 'test-universe-1',
  name: 'Test Universe',
  description: 'A test universe for testing',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  physics: {
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
  },
  audio: {
    volume: 0.5,
    effects: [],
  },
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Wait for loading states to finish
export const waitForLoadingToFinish = async () => {
  const loading = document.querySelector('[data-testid="loading"]');
  if (loading) {
    await waitForElementToBeRemoved(() => loading);
  }
};

// Mock API responses
export const mockApiResponse = data => ({
  ok: true,
  json: () => Promise.resolve(data),
});

export const mockApiError = (status = 400, message = 'Error') => ({
  ok: false,
  status,
  json: () => Promise.resolve({ message }),
});

// Common test actions
export const commonTestActions = {
  login: async (user = createMockUser()) => {
    // Mock successful login
    fetch.mockResolvedValueOnce(mockApiResponse({ user }));
    return user;
  },

  createUniverse: async (universe = createMockUniverse()) => {
    // Mock successful universe creation
    fetch.mockResolvedValueOnce(mockApiResponse({ universe }));
    return universe;
  },

  simulatePhysics: (duration = 1000) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          position: { x: 100, y: 100 },
          velocity: { x: 10, y: 10 },
        });
      }, duration);
    });
  },

  processAudio: (duration = 1000) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          frequency: 440,
          amplitude: 0.5,
        });
      }, duration);
    });
  },
};

// Test event helpers
export const fireMouseEvent = (element, eventType, coordinates) => {
  const event = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    clientX: coordinates.x,
    clientY: coordinates.y,
  });
  element.dispatchEvent(event);
};

export const simulateWebSocketMessage = data => {
  const mockWs = global.WebSocket.mock.instances[0];
  if (mockWs && mockWs.onmessage) {
    mockWs.onmessage({ data: JSON.stringify(data) });
  }
};

// Custom test matchers
expect.extend({
  toHaveBeenCalledOnceWith(received, ...expected) {
    const pass =
      received.mock.calls.length === 1 &&
      JSON.stringify(received.mock.calls[0]) === JSON.stringify(expected);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to have been called once with ${expected}`
          : `expected ${received} to have been called once with ${expected}`,
    };
  },
});
