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

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
