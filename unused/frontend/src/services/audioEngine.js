import * as Tone from "tone";

class AudioEngine {
  constructor() {
    this.isPlaying = false;
    this.bpm = 120;
    this.volume = 1;
    this.synth = null;
    this.scheduledEvents = [];
    Tone.Transport.bpm.value = this.bpm;
  }

  async start() {
    await Tone.start();
    this.isPlaying = true;
    Tone.Transport.start();
  }

  stop() {
    this.isPlaying = false;
    Tone.Transport.stop();
  }

  createSynth() {
    if (this.synth) {
      this.synth.dispose();
    }
    this.synth = new Tone.Synth().toDestination();
    return this.synth;
  }

  dispose() {
    this.stop();
    this.clearScheduledEvents();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }

  scheduleNote(note, time) {
    if (!this.synth) {
      this.createSynth();
    }
    const event = Tone.Transport.schedule(() => {
      this.synth.triggerAttackRelease(note, "8n");
    }, time);
    this.scheduledEvents.push(event);
    return event;
  }

  setBPM(bpm) {
    this.bpm = bpm;
    Tone.Transport.bpm.value = bpm;
  }

  clearScheduledEvents() {
    this.scheduledEvents.forEach((id) => {
      Tone.Transport.clear(id);
    });
    this.scheduledEvents = [];
    Tone.Transport.cancel();
  }
}

export default AudioEngine;
