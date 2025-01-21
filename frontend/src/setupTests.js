import '@testing-library/jest-dom';
import './tests/mocks/setupMocks';

// Mock window.URL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock crypto for UUID generation
global.crypto = {
  randomUUID: () => 'test-uuid',
};

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.createGain = jest.fn(() => ({
      connect: jest.fn(),
      gain: { value: 1 },
    }));
    this.createOscillator = jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 },
    }));
    this.createAnalyser = jest.fn(() => ({
      connect: jest.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
    }));
  }
}

global.AudioContext = MockAudioContext;

// Mock fetch
global.fetch = jest.fn();

// Mock service worker
class ServiceWorkerRegistration {
  constructor() {
    this.active = {
      postMessage: jest.fn(),
    };
    this.installing = {
      addEventListener: jest.fn(),
      state: 'installed',
    };
    this.scope = '/';
    this.addEventListener = jest.fn();
  }
}

class ServiceWorker {
  constructor() {
    this.ready = Promise.resolve(new ServiceWorkerRegistration());
    this.register = jest
      .fn()
      .mockResolvedValue(new ServiceWorkerRegistration());
    this.addEventListener = jest.fn();
    this.controller = {
      state: 'activated',
    };
  }
}

// Mock web vitals
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(cb => cb({ name: 'CLS', value: 0.1, rating: 'good' })),
  getFID: jest.fn(cb => cb({ name: 'FID', value: 100, rating: 'good' })),
  getLCP: jest.fn(cb => cb({ name: 'LCP', value: 2500, rating: 'good' })),
  getTTFB: jest.fn(cb => cb({ name: 'TTFB', value: 100, rating: 'good' })),
  getFCP: jest.fn(cb => cb({ name: 'FCP', value: 1000, rating: 'good' })),
}));

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback([{ isIntersecting: true }]);
  }

  unobserve() {}
  disconnect() {}
}

// Mock PerformanceObserver
class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback({
      getEntries: () => [
        {
          name: 'first-contentful-paint',
          startTime: 1000,
          entryType: 'paint',
        },
      ],
    });
  }

  disconnect() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock matchMedia
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Assign mocks to global object
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserver });
Object.defineProperty(window, 'IntersectionObserver', {
  value: IntersectionObserver,
});
Object.defineProperty(window, 'PerformanceObserver', {
  value: PerformanceObserver,
});
Object.defineProperty(navigator, 'serviceWorker', {
  value: new ServiceWorker(),
});

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Array(4),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
}));
