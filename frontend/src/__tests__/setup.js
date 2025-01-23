import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { vi } from 'vitest';

// Mock Redux Store
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = initialState.auth || {}, action) => state,
      universe: (state = initialState.universe || {}, action) => state,
      analytics: (state = initialState.analytics || {}, action) => state,
      music: (state = initialState.music || {}, action) => state,
      notifications: (state = initialState.notifications || {}, action) =>
        state,
    },
    preloadedState: initialState,
  });
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return vi.fn();
  }
  unobserve() {
    return vi.fn();
  }
  disconnect() {
    return vi.fn();
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return vi.fn();
  }
  unobserve() {
    return vi.fn();
  }
  disconnect() {
    return vi.fn();
  }
};

// Mock window
const windowMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  requestAnimationFrame: vi.fn(callback => setTimeout(callback, 0)),
  cancelAnimationFrame: vi.fn(),
  getComputedStyle: vi.fn(() => ({
    getPropertyValue: vi.fn(),
  })),
  scroll: vi.fn(),
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  scrollIntoView: vi.fn(),
  fetch: vi.fn(),
  Audio: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  AudioContext: vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 0 },
    })),
    destination: {},
  })),
  WebSocket: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  })),
};

Object.assign(global, windowMock);

// Mock clipboard API
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
});

// Test utilities
export const renderWithProviders = (
  ui,
  { preloadedState = {}, ...renderOptions } = {}
) => {
  const store = createMockStore(preloadedState);
  const Wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
