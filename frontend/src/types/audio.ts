export interface AudioTrack {
  id: number;
  name: string;
  type: 'audio' | 'midi';
  fileType: string;
  filePath: string;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  isPlaying: boolean;
  midiSequenceId?: number;
  effects: AudioEffect[];
  projectId: number;
  createdAt: string;
  updatedAt: string;
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
  type: 'noteOn' | 'noteOff' | 'controlChange';
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  time: number;
  trackId: number;
}

export interface Note {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
}

export interface MIDISequence {
  id: number;
  name: string;
  events: MIDIEvent[];
  duration: number;
  loop: boolean;
  trackId: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AudioParameters {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: 'wav' | 'mp3' | 'ogg';
  normalize: boolean;
  compressionQuality?: number;
}
