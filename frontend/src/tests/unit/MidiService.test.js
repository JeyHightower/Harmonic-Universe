import { Midi } from '@tonejs/midi';
import MidiService from '../../services/MidiService';

jest.mock('@tonejs/midi');

describe('MidiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MIDI File Parsing', () => {
    test('successfully parses MIDI file', async () => {
      const mockMidiData = {
        duration: 10,
        tracks: [
          {
            name: 'Track 1',
            notes: [
              { midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
              { midi: 64, time: 0.5, duration: 0.5, velocity: 0.7 },
            ],
            channel: 1,
            instrument: { name: 'acoustic_grand_piano' },
          },
        ],
      };

      Midi.mockImplementation(() => mockMidiData);

      const mockArrayBuffer = new ArrayBuffer(8);
      const file = new File([''], 'test.mid', { type: 'audio/midi' });
      Object.defineProperty(file, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      const result = await MidiService.parseMidiFile(file);

      expect(result.name).toBe('test.mid');
      expect(result.duration).toBe(10);
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].notes).toHaveLength(2);
    });

    test('handles invalid MIDI file', async () => {
      Midi.mockImplementation(() => {
        throw new Error('Invalid MIDI file');
      });

      const mockArrayBuffer = new ArrayBuffer(8);
      const file = new File([''], 'invalid.mid', { type: 'audio/midi' });
      Object.defineProperty(file, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      await expect(MidiService.parseMidiFile(file)).rejects.toThrow();
    });
  });

  describe('MIDI File Creation', () => {
    test('creates MIDI file from tracks', () => {
      const mockTracks = [
        {
          name: 'Melody',
          notes: [
            { pitch: 60, time: 0, duration: 0.5, velocity: 0.8 },
            { pitch: 64, time: 0.5, duration: 0.5, velocity: 0.7 },
          ],
        },
      ];

      const addTrackMock = jest.fn().mockReturnValue({
        addNote: jest.fn(),
        name: '',
      });

      Midi.mockImplementation(() => ({
        addTrack: addTrackMock,
      }));

      const result = MidiService.createMidiFile(mockTracks);
      expect(addTrackMock).toHaveBeenCalled();
    });
  });

  describe('MIDI Export', () => {
    test('exports MIDI file', async () => {
      const mockTracks = [
        {
          name: 'Melody',
          notes: [{ pitch: 60, time: 0, duration: 0.5, velocity: 0.8 }],
        },
      ];

      const toArrayMock = jest.fn().mockReturnValue(new Uint8Array());
      Midi.mockImplementation(() => ({
        addTrack: jest.fn().mockReturnValue({
          addNote: jest.fn(),
          name: '',
        }),
        toArray: toArrayMock,
      }));

      await MidiService.exportMidiFile(mockTracks, 'test.mid');
      expect(toArrayMock).toHaveBeenCalled();
    });

    test('handles export errors', async () => {
      const mockTracks = [
        {
          name: 'Melody',
          notes: [{ pitch: 60, time: 0, duration: 0.5, velocity: 0.8 }],
        },
      ];

      Midi.mockImplementation(() => ({
        addTrack: jest.fn().mockReturnValue({
          addNote: jest.fn(),
          name: '',
        }),
        toArray: jest.fn().mockImplementation(() => {
          throw new Error('Export failed');
        }),
      }));

      await expect(MidiService.exportMidiFile(mockTracks)).rejects.toThrow();
    });
  });

  describe('MIDI Conversion', () => {
    test('converts MIDI to sequence', () => {
      const midiData = {
        tracks: [
          {
            name: 'Track 1',
            notes: [{ pitch: 60, time: 0, duration: 0.5, velocity: 0.8 }],
            instrument: 'piano',
            channel: 1,
          },
        ],
      };

      const result = MidiService.convertMidiToSequence(midiData);
      expect(result).toHaveLength(1);
      expect(result[0].notes).toHaveLength(1);
      expect(result[0].parameters.instrument).toBe('piano');
    });

    test('converts sequence to MIDI', () => {
      const sequences = [
        {
          name: 'Track 1',
          notes: [
            {
              id: '1',
              pitch: 60,
              startTime: 0,
              duration: 0.5,
              velocity: 0.8,
            },
          ],
          parameters: {
            instrument: 'piano',
            channel: 1,
          },
        },
      ];

      const result = MidiService.convertSequenceToMidi(sequences);
      expect(result).toHaveLength(1);
      expect(result[0].notes).toHaveLength(1);
      expect(result[0].instrument).toBe('piano');
    });
  });
});
