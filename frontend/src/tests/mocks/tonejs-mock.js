class ToneObject {
  connect() {
    return this;
  }
  disconnect() {
    return this;
  }
  dispose() {}
  start() {}
  stop() {}
  toDestination() {
    return this;
  }
}

class Synth extends ToneObject {
  triggerAttack() {}
  triggerRelease() {}
}

class Transport extends ToneObject {
  static start() {}
  static stop() {}
  static pause() {}
  static position = 0;
  static bpm = { value: 120 };
  static schedule() {}
  static scheduleRepeat() {}
  static cancel() {}
}

class Gain extends ToneObject {
  gain = { value: 1 };
}

class Filter extends ToneObject {
  frequency = { value: 1000 };
  Q = { value: 1 };
}

class Reverb extends ToneObject {
  decay = 1.5;
  wet = { value: 0.5 };
}

class FeedbackDelay extends ToneObject {
  delayTime = { value: 0.25 };
  feedback = { value: 0.5 };
}

export default {
  Synth,
  Transport,
  Gain,
  Filter,
  Reverb,
  FeedbackDelay,
  start: () => Promise.resolve(),
  loaded: () => Promise.resolve(),
  context: {
    resume: () => Promise.resolve(),
    state: 'running',
  },
  Destination: new Gain(),
  now: () => 0,
};
