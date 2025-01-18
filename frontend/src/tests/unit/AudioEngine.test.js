import * as Tone from 'tone';
import AudioEngine from '../../services/AudioEngine';

jest.mock('tone', () => ({
  start: jest.fn(),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    bpm: { value: 120 },
    position: 0,
    schedule: jest.fn(),
    clear: jest.fn(),
    cancel: jest.fn(),
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn(),
  })),
  now: jest.fn(() => 0),
}));

describe('AudioEngine', () => {
  let audioEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    audioEngine = new AudioEngine();
  });

  afterEach(() => {
    audioEngine.dispose();
  });

  test('initializes with default settings', () => {
    expect(audioEngine.isPlaying).toBeFalsy();
    expect(audioEngine.bpm).toBe(120);
    expect(audioEngine.volume).toBe(1);
    expect(Tone.Transport.bpm.value).toBe(120);
  });

  test('starts audio context', async () => {
    await audioEngine.start();
    expect(Tone.start).toHaveBeenCalled();
    expect(Tone.Transport.start).toHaveBeenCalled();
    expect(audioEngine.isPlaying).toBeTruthy();
  });

  test('stops audio context', () => {
    audioEngine.stop();
    expect(Tone.Transport.stop).toHaveBeenCalled();
    expect(audioEngine.isPlaying).toBeFalsy();
  });

  test('creates and disposes synth', () => {
    const synth = audioEngine.createSynth();
    expect(synth).toBeDefined();
    expect(Tone.Synth).toHaveBeenCalled();
    expect(synth.toDestination).toHaveBeenCalled();

    audioEngine.dispose();
    expect(synth.dispose).toHaveBeenCalled();
  });

  test('schedules note', () => {
    const note = 'C4';
    const time = 0;
    const event = audioEngine.scheduleNote(note, time);

    expect(Tone.Transport.schedule).toHaveBeenCalled();
    expect(audioEngine.scheduledEvents).toContain(event);
  });

  test('changes BPM', () => {
    const newBPM = 140;
    audioEngine.setBPM(newBPM);

    expect(audioEngine.bpm).toBe(newBPM);
    expect(Tone.Transport.bpm.value).toBe(newBPM);
  });

  test('clears scheduled events', () => {
    const note = 'C4';
    const time = 0;
    const event = audioEngine.scheduleNote(note, time);

    audioEngine.clearScheduledEvents();

    expect(Tone.Transport.clear).toHaveBeenCalledWith(event);
    expect(Tone.Transport.cancel).toHaveBeenCalled();
    expect(audioEngine.scheduledEvents).toHaveLength(0);
  });
});
