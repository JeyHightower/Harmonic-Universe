import { configure } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, vi } from 'vitest';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Setup JSDOM with enhanced features
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  features: {
    FetchExternalResources: ['script', 'css', 'img', 'iframe', 'form'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
  },
  runScripts: 'dangerously',
});

// Setup global environment with enhanced window object
global.window = Object.assign(dom.window, {
  CSS: { supports: () => false },
  matchMedia: vi.fn().mockImplementation(query => ({
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

global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
  language: 'en-US',
  languages: ['en'],
  platform: 'MacIntel',
  clipboard: {
    writeText: vi.fn().mockImplementation(text => Promise.resolve(text)),
    readText: vi.fn().mockImplementation(() => Promise.resolve('')),
  },
};

// Enhanced window methods and properties
Object.defineProperties(window, {
  innerWidth: {
    writable: true,
    configurable: true,
    value: 1024,
  },
  innerHeight: {
    writable: true,
    configurable: true,
    value: 768,
  },
  pageXOffset: {
    writable: true,
    configurable: true,
    value: 0,
  },
  pageYOffset: {
    writable: true,
    configurable: true,
    value: 0,
  },
});

// Mock MutationObserver
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.takeRecords = vi.fn();
  }
};

// Mock window properties and methods
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

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
}));
window.ResizeObserver = mockResizeObserver;

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.destination = {
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
    };
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }

  createAnalyser() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    };
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Enhanced localStorage and sessionStorage mock
const createStorageMock = () => {
  const storage = {};
  return {
    getItem: vi.fn(key => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => {
        delete storage[key];
      });
    }),
    length: 0,
    key: vi.fn(index => Object.keys(storage)[index] || null),
    ...storage,
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock() });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock() });

// Enhanced window method mocks
window.scroll = vi.fn();
window.scrollTo = vi.fn();
window.scrollBy = vi.fn();
window.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(),
}));
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();
window.dispatchEvent = vi.fn();
window.requestAnimationFrame = vi.fn(callback => setTimeout(callback, 0));
window.cancelAnimationFrame = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// Mock console methods
console.error = vi.fn();
console.warn = vi.fn();
console.log = vi.fn();

// Enhanced cleanup
beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.clearAllMocks();
  document.body.innerHTML = '';

  // Reset window scroll positions
  window.pageXOffset = 0;
  window.pageYOffset = 0;

  // Clear all event listeners
  window.addEventListener.mockClear();
  window.removeEventListener.mockClear();
  window.dispatchEvent.mockClear();
});

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.send = vi.fn();
    this.close = vi.fn();

    // Auto connect
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  // WebSocket states
  static get CONNECTING() {
    return 0;
  }
  static get OPEN() {
    return 1;
  }
  static get CLOSING() {
    return 2;
  }
  static get CLOSED() {
    return 3;
  }
}

global.WebSocket = MockWebSocket;

// Add custom matchers
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
  toBeInTheDocument(received) {
    const pass = received !== null;
    if (pass) {
      return {
        message: () => `expected ${received} not to be in the document`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be in the document`,
        pass: false,
      };
    }
  },
});
