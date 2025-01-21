import * as Tone from 'tone';

class AudioEngine {
  constructor() {
    this.initialized = false;
    this.resources = new Set();
    this.cleanupHandlers = new Set();

    // Initialize audio components
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.filter = new Tone.Filter(1000, 'lowpass').connect(this.synth);
    this.reverb = new Tone.Reverb(3).connect(this.filter);
    this.delay = new Tone.FeedbackDelay('8n', 0.5).connect(this.reverb);

    // Sequence setup
    this.notes = ['C4', 'E4', 'G4', 'B4', 'D5'];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.sequencer = null;

    // Physics to audio mappings
    this.mappings = {
      gravity: {
        param: 'frequency',
        min: 200,
        max: 800,
        transform: value => this.mapRange(value, 0, 20, 200, 800),
      },
      friction: {
        param: 'filterFreq',
        min: 100,
        max: 5000,
        transform: value => this.mapRange(value, 0, 1, 100, 5000),
      },
      elasticity: {
        param: 'reverbDecay',
        min: 0.1,
        max: 5,
        transform: value => this.mapRange(value, 0, 1, 0.1, 5),
      },
      airResistance: {
        param: 'release',
        min: 0.1,
        max: 2,
        transform: value => this.mapRange(value, 0, 1, 0.1, 2),
      },
      density: {
        param: 'volume',
        min: -20,
        max: 0,
        transform: value => this.mapRange(value, 0, 5, -20, 0),
      },
    };
  }

  initialize() {
    if (this.initialized) return;

    try {
      this.synth = new Tone.PolySynth().toDestination();
      this.filter = new Tone.Filter(1000, 'lowpass').toDestination();
      this.reverb = new Tone.Reverb(2).toDestination();
      this.delay = new Tone.FeedbackDelay('8n', 0.5).toDestination();

      // Track resources for cleanup
      this.resources.add(this.synth);
      this.resources.add(this.filter);
      this.resources.add(this.reverb);
      this.resources.add(this.delay);

      // Connect audio nodes
      this.synth.connect(this.filter);
      this.filter.connect(this.reverb);
      this.reverb.connect(this.delay);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      this.dispose();
      throw error;
    }
  }

  addCleanupHandler(handler) {
    this.cleanupHandlers.add(handler);
  }

  removeCleanupHandler(handler) {
    this.cleanupHandlers.delete(handler);
  }

  // Utility function to map ranges
  mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  // Update audio parameters based on physics
  updateParameters(physicsParams) {
    const { gravity, friction, elasticity, airResistance, density } =
      physicsParams;

    // Update synth parameters
    this.synth.set({
      volume: this.mappings.density.transform(density),
      envelope: {
        release: this.mappings.airResistance.transform(airResistance),
      },
    });

    // Update filter
    this.filter.frequency.value = this.mappings.friction.transform(friction);

    // Update reverb
    this.reverb.decay = this.mappings.elasticity.transform(elasticity);

    // Update base frequency for note generation
    this.baseFreq = this.mappings.gravity.transform(gravity);
  }

  // Start audio playback
  async start() {
    if (this.isPlaying) return;

    await Tone.start();
    Tone.Transport.bpm.value = 120;

    this.sequencer = new Tone.Sequence(
      (time, note) => {
        // Generate note based on current physics parameters
        const noteWithOctave = this.notes[this.currentIndex];
        this.synth.triggerAttackRelease(noteWithOctave, '8n', time);
        this.currentIndex = (this.currentIndex + 1) % this.notes.length;
      },
      this.notes,
      '4n'
    ).start(0);

    Tone.Transport.start();
    this.isPlaying = true;
  }

  // Stop audio playback
  stop() {
    if (!this.isPlaying) return;

    if (this.sequencer) {
      this.sequencer.stop();
      this.sequencer.dispose();
    }
    Tone.Transport.stop();
    this.isPlaying = false;
  }

  dispose() {
    // Execute cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch (error) {
        console.error('Error in cleanup handler:', error);
      }
    }
    this.cleanupHandlers.clear();

    // Dispose audio resources
    for (const resource of this.resources) {
      try {
        if (resource && typeof resource.dispose === 'function') {
          resource.dispose();
        }
      } catch (error) {
        console.error('Error disposing audio resource:', error);
      }
    }
    this.resources.clear();

    // Reset state
    this.initialized = false;
    this.synth = null;
    this.filter = null;
    this.reverb = null;
    this.delay = null;
  }
}

export default AudioEngine;
