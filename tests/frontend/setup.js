import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}
global.ResizeObserver = MockResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
  }
  send(data) {
    this.onmessage && this.onmessage({ data });
  }
  close() {
    this.onclose && this.onclose();
  }
}
global.WebSocket = MockWebSocket;
WebSocket.OPEN = 1;

// Mock fetch
global.fetch = vi.fn();

// Suppress React 18 Strict Mode warnings
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ReactDOM.render is no longer supported')) return;
  originalError.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup test environment
beforeAll(() => {
  // Add any global setup here
});

afterAll(() => {
  // Clean up any global setup
});
