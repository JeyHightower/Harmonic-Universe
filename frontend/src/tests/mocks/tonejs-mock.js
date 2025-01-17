const Tone = {
  start: jest.fn(),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    position: 0,
    bpm: {
      value: 120,
    },
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  Sequence: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
  now: jest.fn(() => 0),
};

export default Tone;
