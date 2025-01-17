import * as Tone from 'tone';

class AudioEngine {
  constructor() {
    this.synth = null;
    this.recorder = null;
    this.isPlaying = false;
    this.currentWaveform = 'sine';
    this.currentHarmonics = Array(16).fill(0);
    this.currentHarmonics[0] = 1; // Fundamental frequency
    this.volume = -12; // Default volume in dB
    this.sequence = null;
    this.harmonicOscillators = [];
  }

  async initialize() {
    await Tone.start();
    this.setupSynth();
    this.setupRecorder();
  }

  setupSynth() {
    // Clean up existing oscillators
    this.harmonicOscillators.forEach(osc => osc.dispose());
    this.harmonicOscillators = [];

    // Create oscillators for each harmonic
    for (let i = 0; i < this.currentHarmonics.length; i++) {
      const osc = new Tone.Oscillator({
        type: this.currentWaveform,
        volume: Tone.gainToDb(this.currentHarmonics[i]),
      }).connect(new Tone.Gain(0).toDestination());

      this.harmonicOscillators.push(osc);
    }

    // Main synth for non-harmonic sounds
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: this.currentWaveform,
      },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8,
      },
      volume: this.volume,
    }).toDestination();
  }

  setupRecorder() {
    this.recorder = new Tone.Recorder();
    Tone.Destination.connect(this.recorder);
  }

  setWaveform(waveform) {
    this.currentWaveform = waveform;
    this.setupSynth();
  }

  setHarmonics(harmonics) {
    this.currentHarmonics = harmonics;
    this.harmonicOscillators.forEach((osc, i) => {
      osc.volume.value = Tone.gainToDb(harmonics[i]);
    });
  }

  setVolume(volume) {
    this.volume = volume;
    this.synth.volume.value = volume;
    this.harmonicOscillators.forEach(osc => {
      osc.volume.value = volume;
    });
  }

  startNote(note, time) {
    const frequency = Tone.Frequency(note).toFrequency();

    // Start harmonic oscillators
    this.harmonicOscillators.forEach((osc, i) => {
      osc.frequency.value = frequency * (i + 1);
      osc.start(time);
    });

    // Also trigger the main synth
    this.synth.triggerAttack(note, time);
  }

  stopNote(note, time) {
    // Stop harmonic oscillators
    this.harmonicOscillators.forEach(osc => {
      osc.stop(time);
    });

    // Release the main synth
    this.synth.triggerRelease(note, time);
  }

  startSequence(notes, interval = '8n') {
    if (this.isPlaying) return;

    this.sequence = new Tone.Sequence(
      (time, note) => {
        this.startNote(note, time);
        Tone.Draw.schedule(() => {
          // Trigger visualization update if needed
        }, time);
      },
      notes,
      interval
    ).start(0);

    Tone.Transport.start();
    this.isPlaying = true;
  }

  stopSequence() {
    if (!this.isPlaying) return;

    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
      this.sequence = null;
    }

    // Stop all oscillators
    this.harmonicOscillators.forEach(osc => {
      osc.stop();
    });

    // Stop the main synth
    this.synth.releaseAll();

    Tone.Transport.stop();
    this.isPlaying = false;
  }

  async startRecording() {
    if (!this.recorder) return;
    await this.recorder.start();
  }

  async stopRecording() {
    if (!this.recorder) return;
    const recording = await this.recorder.stop();
    return recording;
  }

  async exportAudio({ format = 'wav', duration = 30 } = {}) {
    if (!this.isPlaying) return null;

    await this.startRecording();

    // Record for the specified duration
    await new Promise(resolve => setTimeout(resolve, duration * 1000));

    const recording = await this.stopRecording();

    // Convert to the desired format
    const blob = new Blob([recording], { type: `audio/${format}` });
    return blob;
  }

  dispose() {
    this.stopSequence();

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    this.harmonicOscillators.forEach(osc => {
      osc.dispose();
    });
    this.harmonicOscillators = [];

    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }
  }
}

export default AudioEngine;
