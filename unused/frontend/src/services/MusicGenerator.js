import * as Tone from "tone";

class MusicGenerator {
  constructor() {
    // Initialize synthesizer with effects
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.2,
        release: 1,
      },
    });

    // Effects chain
    this.reverb = new Tone.Reverb({
      decay: 5,
      wet: 0.3,
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.3,
      wet: 0.2,
    });

    this.filter = new Tone.Filter({
      type: "lowpass",
      frequency: 1000,
      rolloff: -12,
    });

    // Connect effects chain
    this.synth.chain(this.filter, this.delay, this.reverb, Tone.Destination);

    // Initialize sequence
    this.sequence = null;
    this.isPlaying = false;
  }

  setParameters(params) {
    const {
      reverbDecay = 5,
      reverbWet = 0.3,
      delayTime = "8n",
      delayFeedback = 0.3,
      delayWet = 0.2,
      filterFreq = 1000,
      filterQ = 1,
      attack = 0.05,
      decay = 0.2,
      sustain = 0.2,
      release = 1,
    } = params;

    // Update reverb
    this.reverb.set({
      decay: reverbDecay,
      wet: reverbWet,
    });

    // Update delay
    this.delay.set({
      delayTime,
      feedback: delayFeedback,
      wet: delayWet,
    });

    // Update filter
    this.filter.set({
      frequency: filterFreq,
      Q: filterQ,
    });

    // Update synth envelope
    this.synth.set({
      envelope: {
        attack,
        decay,
        sustain,
        release,
      },
    });
  }

  generateSequence(params) {
    const {
      scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
      rootNote = "C4",
      tempo = 120,
      noteLength = "8n",
      probability = 0.7,
    } = params;

    // Set tempo
    Tone.Transport.bpm.value = tempo;

    // Generate sequence of notes
    const sequence = [];
    const numSteps = 16;

    for (let i = 0; i < numSteps; i++) {
      if (Math.random() < probability) {
        const noteIndex = Math.floor(Math.random() * scale.length);
        sequence.push(scale[noteIndex]);
      } else {
        sequence.push(null);
      }
    }

    // Create Tone.js sequence
    if (this.sequence) {
      this.sequence.dispose();
    }

    this.sequence = new Tone.Sequence(
      (time, note) => {
        if (note) {
          this.synth.triggerAttackRelease(note, noteLength, time);
        }
      },
      sequence,
      "16n",
    );

    return sequence;
  }

  async start() {
    if (!this.sequence) {
      throw new Error("No sequence generated");
    }

    await Tone.start();
    Tone.Transport.start();
    this.sequence.start(0);
    this.isPlaying = true;
  }

  stop() {
    if (this.sequence) {
      this.sequence.stop();
      Tone.Transport.stop();
      this.isPlaying = false;
    }
  }

  async exportAudio(duration) {
    // Create offline context
    const offline = new Tone.OfflineContext(2, duration, 44100);

    // Render audio
    const buffer = await Tone.Offline(() => {
      // Start sequence
      this.sequence.start(0);

      // Stop sequence after duration
      this.sequence.stop(duration);
    }, duration);

    return buffer;
  }

  dispose() {
    if (this.sequence) {
      this.sequence.dispose();
    }
    this.synth.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.filter.dispose();
  }
}

export default MusicGenerator;
