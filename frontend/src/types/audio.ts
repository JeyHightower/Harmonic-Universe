export interface AudioTrack {
  id: number;
  title: string;
  url: string;
  duration: number;
  waveform?: number[];
  projectId: number;
  createdAt: string;
  updatedAt: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  midiSequenceId?: number;
  effects: AudioEffect[];
  isPlaying: boolean;
  pan: number;
  fileType: string;
  filePath: string;
}

export interface AudioBuffer {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
  copyFromChannel: (
    destination: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ) => void;
  copyToChannel: (source: Float32Array, channelNumber: number, startInChannel?: number) => void;
}

export interface AudioFormData {
  title: string;
  file: File;
}

export interface AudioProcessingConfig {
  normalize: boolean;
  trim: boolean;
  fadeIn: number;
  fadeOut: number;
  gain: number;
  pan: number;
  effects: AudioEffect[];
}

export interface AudioEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: AudioEffectParameter[];
}

export interface AudioEffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface MIDIEvent {
  id: number;
  type: 'note_on' | 'note_off' | 'control_change';
  timestamp: number;
  note?: number;
  velocity?: number;
  duration?: number;
  controller?: number;
  value?: number;
}

export interface Note {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
}

export interface MIDISequence {
  id: number;
  trackId: number;
  duration: number;
  events: MIDIEvent[];
}
