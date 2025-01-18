class Midi {
  constructor() {
    this.tracks = [];
    this.header = {
      tempos: [],
      timeSignatures: [],
      keySignatures: [],
      meta: [],
      name: '',
    };
  }

  toArray() {
    return this.tracks;
  }

  fromUrl() {
    return Promise.resolve(this);
  }
}

export default Midi;
