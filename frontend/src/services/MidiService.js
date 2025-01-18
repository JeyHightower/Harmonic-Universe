import { Midi } from '@tonejs/midi';

class MidiService {
  async parseMidiFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      return {
        name: file.name,
        duration: midi.duration,
        tracks: midi.tracks.map(track => ({
          name: track.name || 'Untitled Track',
          notes: track.notes.map(note => ({
            pitch: note.midi,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
          })),
          channel: track.channel,
          instrument: track.instrument.name,
        })),
      };
    } catch (error) {
      console.error('Error parsing MIDI file:', error);
      throw new Error(
        'Failed to parse MIDI file. Please ensure it is a valid MIDI file.'
      );
    }
  }

  createMidiFile(tracks) {
    try {
      const midi = new Midi();

      tracks.forEach(track => {
        const midiTrack = midi.addTrack();
        midiTrack.name = track.name;

        track.notes.forEach(note => {
          midiTrack.addNote({
            midi: note.pitch,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
          });
        });
      });

      return midi;
    } catch (error) {
      console.error('Error creating MIDI file:', error);
      throw new Error('Failed to create MIDI file from tracks.');
    }
  }

  async exportMidiFile(tracks, filename = 'sequence.mid') {
    try {
      const midi = this.createMidiFile(tracks);
      const arrayBuffer = midi.toArray();
      const blob = new Blob([arrayBuffer], { type: 'audio/midi' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting MIDI file:', error);
      throw new Error('Failed to export MIDI file.');
    }
  }

  convertMidiToSequence(midiData) {
    return midiData.tracks.map(track => ({
      id: crypto.randomUUID(),
      name: track.name,
      notes: track.notes.map(note => ({
        id: crypto.randomUUID(),
        pitch: note.pitch,
        startTime: note.time,
        duration: note.duration,
        velocity: note.velocity,
      })),
      parameters: {
        instrument: track.instrument,
        channel: track.channel,
      },
    }));
  }

  convertSequenceToMidi(sequences) {
    return sequences.map(sequence => ({
      name: sequence.name,
      notes: sequence.notes.map(note => ({
        pitch: note.pitch,
        time: note.startTime,
        duration: note.duration,
        velocity: note.velocity,
      })),
      instrument: sequence.parameters.instrument,
      channel: sequence.parameters.channel,
    }));
  }
}

export default new MidiService();
