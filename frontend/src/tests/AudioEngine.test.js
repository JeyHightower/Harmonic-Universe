import AudioEngine from '../components/Audio/AudioEngine';

describe('AudioEngine', () => {
  let audioEngine;

  beforeEach(() => {
    audioEngine = new AudioEngine();
  });

  afterEach(() => {
    if (audioEngine.synth) audioEngine.synth.dispose();
    if (audioEngine.filter) audioEngine.filter.dispose();
    if (audioEngine.reverb) audioEngine.reverb.dispose();
    if (audioEngine.delay) audioEngine.delay.dispose();
  });

  test('initializes with default parameters', () => {
    expect(audioEngine.synth).toBeDefined();
    expect(audioEngine.filter).toBeDefined();
    expect(audioEngine.reverb).toBeDefined();
    expect(audioEngine.delay).toBeDefined();
    expect(audioEngine.notes).toEqual(['C4', 'E4', 'G4', 'B4', 'D5']);
    expect(audioEngine.isPlaying).toBe(false);
  });

  test('handles physics parameter updates', () => {
    const physicsParams = {
      gravity: 10,
      friction: 0.5,
      elasticity: 0.7,
      airResistance: 0.3,
      density: 2.5,
    };

    audioEngine.updateParameters(physicsParams);

    // Check if parameters were mapped correctly
    expect(audioEngine.filter.frequency.value).toBeDefined();
    expect(audioEngine.reverb.decay.value).toBeDefined();
    expect(audioEngine.synth.volume.value).toBeDefined();
  });

  test('can start and stop playback', async () => {
    await audioEngine.start();
    expect(audioEngine.isPlaying).toBe(true);

    audioEngine.stop();
    expect(audioEngine.isPlaying).toBe(false);
  });

  test('maps physics parameters to audio parameters', () => {
    const gravity = 10;
    const mappedFreq = audioEngine.mappings.gravity.transform(gravity);
    expect(mappedFreq).toBeGreaterThanOrEqual(audioEngine.mappings.gravity.min);
    expect(mappedFreq).toBeLessThanOrEqual(audioEngine.mappings.gravity.max);
  });
});
