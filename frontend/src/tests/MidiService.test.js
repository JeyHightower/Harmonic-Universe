import { Midi } from '@tonejs/midi';
import MidiService from '../services/MidiService';

jest.mock('@tonejs/midi');

describe('MidiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseMidiFile', () => {
    test('successfully parses MIDI file', async () => {
      const mockFile = new File([''], 'test.mid', { type: 'audio/midi' });
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockMidi = {
        duration: 4,
        tracks: [
          {
            name: 'Test Track',
            notes: [
              {
                midi: 60,
                time: 0,
                duration: 0.5,
                velocity: 0.8,
              },
            ],
            channel: 1,
            instrument: {
              name: 'acoustic_grand_piano',
            },
          },
        ],
      };

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockArrayBuffer);
      Midi.mockImplementation(() => mockMidi);

      const result = await MidiService.parseMidiFile(mockFile);

      expect(mockFile.arrayBuffer).toHaveBeenCalled();
      expect(Midi).toHaveBeenCalledWith(mockArrayBuffer);
      expect(result).toEqual({
        name: 'test.mid',
        duration: 4,
        tracks: [
          {
            name: 'Test Track',
            notes: [
              {
                pitch: 60,
                time: 0,
                duration: 0.5,
                velocity: 0.8,
              },
            ],
            channel: 1,
            instrument: 'acoustic_grand_piano',
          },
        ],
      });
    });

    test('handles parsing errors', async () => {
      const mockFile = new File([''], 'test.mid', { type: 'audio/midi' });
      mockFile.arrayBuffer = jest
        .fn()
        .mockRejectedValue(new Error('Parse error'));

      await expect(MidiService.parseMidiFile(mockFile)).rejects.toThrow(
        'Failed to parse MIDI file'
      );
    });
  });

  describe('createMidiFile', () => {
    test('successfully creates MIDI file', () => {
      const mockTracks = [
        {
          name: 'Test Track',
          notes: [
            {
              pitch: 60,
              time: 0,
              duration: 0.5,
              velocity: 0.8,
            },
          ],
        },
      ];

      const mockMidiTrack = {
        name: '',
        addNote: jest.fn(),
      };

      const mockMidi = {
        addTrack: jest.fn().mockReturnValue(mockMidiTrack),
      };

      Midi.mockImplementation(() => mockMidi);

      const result = MidiService.createMidiFile(mockTracks);

      expect(Midi).toHaveBeenCalled();
      expect(mockMidi.addTrack).toHaveBeenCalled();
      expect(mockMidiTrack.addNote).toHaveBeenCalledWith({
        midi: 60,
        time: 0,
        duration: 0.5,
        velocity: 0.8,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('convertMidiToSequence', () => {
    test('successfully converts MIDI data to sequence', () => {
      const mockMidiData = {
        tracks: [
          {
            name: 'Test Track',
            notes: [
              {
                pitch: 60,
                time: 0,
                duration: 0.5,
                velocity: 0.8,
              },
            ],
            instrument: 'acoustic_grand_piano',
            channel: 1,
          },
        ],
      };

      const result = MidiService.convertMidiToSequence(mockMidiData);

      expect(result[0]).toEqual(
        expect.objectContaining({
          name: 'Test Track',
          notes: expect.arrayContaining([
            expect.objectContaining({
              pitch: 60,
              startTime: 0,
              duration: 0.5,
              velocity: 0.8,
            }),
          ]),
          parameters: {
            instrument: 'acoustic_grand_piano',
            channel: 1,
          },
        })
      );
    });
  });

  describe('convertSequenceToMidi', () => {
    test('successfully converts sequence to MIDI format', () => {
      const mockSequences = [
        {
          name: 'Test Track',
          notes: [
            {
              pitch: 60,
              startTime: 0,
              duration: 0.5,
              velocity: 0.8,
            },
          ],
          parameters: {
            instrument: 'acoustic_grand_piano',
            channel: 1,
          },
        },
      ];

      const result = MidiService.convertSequenceToMidi(mockSequences);

      expect(result[0]).toEqual({
        name: 'Test Track',
        notes: [
          {
            pitch: 60,
            time: 0,
            duration: 0.5,
            velocity: 0.8,
          },
        ],
        instrument: 'acoustic_grand_piano',
        channel: 1,
      });
    });
  });
});
