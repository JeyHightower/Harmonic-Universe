// Mock crypto.randomUUID
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => 'test-uuid',
});

// Mock @tonejs/midi
jest.mock('@tonejs/midi', () => ({
  Midi: jest.fn().mockImplementation(() => ({
    addTrack: jest.fn().mockReturnValue({
      addNote: jest.fn(),
      name: '',
    }),
    tracks: [],
    duration: 0,
  })),
}));

// Mock Tone.js
jest.mock('tone', () => ({
  start: jest.fn(),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    bpm: { value: 120 },
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn(),
  })),
  Gain: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    connect: jest.fn(),
    dispose: jest.fn(),
  })),
  Analyser: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    connect: jest.fn(),
    getValue: jest.fn().mockReturnValue([0]),
    getByteFrequencyData: jest.fn(),
    frequencyBinCount: 1024,
    dispose: jest.fn(),
  })),
  Filter: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    frequency: { value: 1000 },
    Q: { value: 1 },
    dispose: jest.fn(),
  })),
  Reverb: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    decay: { value: 3 },
    wet: { value: 0.5 },
    dispose: jest.fn(),
  })),
  FeedbackDelay: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    delayTime: { value: '8n' },
    feedback: { value: 0.5 },
    dispose: jest.fn(),
  })),
}));

// Mock AudioContext and AudioEngine
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.createGain = jest.fn(() => ({
      connect: jest.fn(),
      gain: { value: 1 },
      dispose: jest.fn(),
    }));
    this.createOscillator = jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 },
      dispose: jest.fn(),
    }));
    this.createAnalyser = jest.fn(() => ({
      connect: jest.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      dispose: jest.fn(),
    }));
  }
}

global.AudioContext = MockAudioContext;

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  getImageData: jest.fn(() => ({ data: new Uint8Array(4) })),
  putImageData: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
}));
