import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const storageMock = () => {
  let storage = {};
  return {
    getItem: vi.fn(key => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
  };
};

global.localStorage = storageMock();
global.sessionStorage = storageMock();

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

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.destination = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440, setValueAtTime: vi.fn() },
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn() },
    };
  }

  createAnalyser() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock ResizeObserver
class ResizeObserver {
  observe() {
    return vi.fn();
  }
  unobserve() {
    return vi.fn();
  }
  disconnect() {
    return vi.fn();
  }
}

global.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return vi.fn();
  }
  unobserve() {
    return vi.fn();
  }
  disconnect() {
    return vi.fn();
  }
}

global.IntersectionObserver = IntersectionObserver;

// Cleanup utilities
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  // Reset document body
  document.body.innerHTML = '';
});

// Error handling for unhandled rejections and console errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
