import * as Tone from 'tone';

class AudioAnalyzer {
  constructor() {
    this.bassAnalyzer = new Tone.Analyser('fft', 32);
    this.midAnalyzer = new Tone.Analyser('fft', 64);
    this.highAnalyzer = new Tone.Analyser('fft', 128);

    // Create filters for frequency bands
    this.bassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 200,
      rolloff: -24,
    });

    this.midFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 2000,
      Q: 1,
      rolloff: -24,
    });

    this.highFilter = new Tone.Filter({
      type: 'highpass',
      frequency: 5000,
      rolloff: -24,
    });

    // Connect filters to analyzers
    this.bassFilter.connect(this.bassAnalyzer);
    this.midFilter.connect(this.midAnalyzer);
    this.highFilter.connect(this.highAnalyzer);
  }

  connectSource(source) {
    // Connect source to all filters
    source.fan(this.bassFilter, this.midFilter, this.highFilter);
  }

  disconnectSource(source) {
    source.disconnect(this.bassFilter);
    source.disconnect(this.midFilter);
    source.disconnect(this.highFilter);
  }

  getParameters() {
    // Get frequency data from analyzers
    const bassData = this.bassAnalyzer.getValue();
    const midData = this.midAnalyzer.getValue();
    const highData = this.highAnalyzer.getValue();

    // Calculate average magnitudes for each frequency band
    const bassFrequency = this.calculateAverageMagnitude(bassData);
    const midFrequency = this.calculateAverageMagnitude(midData);
    const highFrequency = this.calculateAverageMagnitude(highData);

    return {
      bassFrequency: this.normalize(bassFrequency),
      midFrequency: this.normalize(midFrequency),
      highFrequency: this.normalize(highFrequency),
    };
  }

  calculateAverageMagnitude(data) {
    const sum = data.reduce((acc, val) => acc + Math.abs(val), 0);
    return sum / data.length;
  }

  normalize(value) {
    // Convert from dB to normalized value between 0 and 1
    const minDb = -100;
    const maxDb = 0;
    return Math.max(0, Math.min(1, (value - minDb) / (maxDb - minDb)));
  }

  dispose() {
    // Clean up Tone.js nodes
    this.bassAnalyzer.dispose();
    this.midAnalyzer.dispose();
    this.highAnalyzer.dispose();
    this.bassFilter.dispose();
    this.midFilter.dispose();
    this.highFilter.dispose();
  }
}

export default AudioAnalyzer;
