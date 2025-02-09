import { useAudio } from '@/hooks/useAudio';

import { PlayArrow, Save, Stop } from '@mui/icons-material';
import { Box, Grid, IconButton, Paper } from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';

const GRID_COLS = 32;
const GRID_ROWS = 12;
const NOTE_DURATION = '8n';

export const MIDIEditor = ({ track, projectId }) => {
  const { isPlaying, updateTrackState } = useAudio(projectId);

  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [synth, setSynth] = useState(null);

  useEffect(() => {
    const newSynth = new Tone.PolySynth().toDestination();
    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, []);

  useEffect(() => {
    if (track.midiSequenceId) {
      // Load MIDI sequence from track
      const midiEvents = track.midiSequenceId;
      const loadedNotes = midiEvents
        .filter(event => event.type === 'note_on')
        .map(event => ({
          pitch: event.note || 0,
          startTime: event.timestamp,
          duration: event.duration || 0.5,
          velocity: event.velocity || 0.7,
        }));
      setNotes(loadedNotes);
    }
  }, [track.midiSequenceId]);

  const handleCellClick = useCallback(
    (row, col) => {
      const pitch = 72 - row; // Start from C5 and go down
      const startTime = col * 0.25; // Each column represents a 16th note

      if (selectedNote && selectedNote.pitch === pitch && selectedNote.startTime === startTime) {
        // Remove note if clicking on selected note
        setNotes(prev => prev.filter(n => n !== selectedNote));
        setSelectedNote(null);
      } else {
        // Add new note
        const newNote = {
          pitch,
          startTime,
          duration: 0.25,
          velocity: 0.7,
        };
        setNotes(prev => [...prev, newNote]);
        setSelectedNote(newNote);
      }

      // Play the note
      if (synth) {
        const freq = Tone.Frequency(pitch, 'midi');
        synth.triggerAttackRelease(freq, NOTE_DURATION);
      }
    },
    [selectedNote, synth]
  );

  const handlePlay = useCallback(() => {
    if (!synth) return;

    const now = Tone.now();
    notes.forEach(note => {
      const freq = Tone.Frequency(note.pitch, 'midi');
      synth.triggerAttackRelease(freq, NOTE_DURATION, now + note.startTime);
    });
  }, [notes, synth]);

  const handleStop = useCallback(() => {
    if (synth) {
      synth.releaseAll();
    }
  }, [synth]);

  const handleSave = useCallback(() => {
    // Convert notes to MIDI events
    const midiEvents = notes.flatMap((note, index) => [
      {
        id: index * 2,
        type: 'note_on',
        timestamp: note.startTime,
        note: note.pitch,
        velocity: note.velocity,
      },
      {
        id: index * 2 + 1,
        type: 'note_off',
        timestamp: note.startTime + note.duration,
        note: note.pitch,
      },
    ]);

    // Update track with new MIDI sequence
    updateTrackState(track.id, { midiSequenceId: midiEvents });
  }, [notes, track.id, updateTrackState]);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={handlePlay} disabled={isPlaying}>
          <PlayArrow />
        </IconButton>
        <IconButton onClick={handleStop} disabled={!isPlaying}>
          <Stop />
        </IconButton>
        <IconButton onClick={handleSave}>
          <Save />
        </IconButton>
      </Box>
      <Paper sx={{ p: 1 }}>
        <Grid container spacing={0.5}>
          {Array.from({ length: GRID_ROWS }).map((_, row) => (
            <Grid item xs={12} key={row}>
              <Box sx={{ display: 'flex' }}>
                {Array.from({ length: GRID_COLS }).map((_, col) => {
                  const pitch = 72 - row;
                  const startTime = col * 0.25;
                  const hasNote = notes.some(n => n.pitch === pitch && n.startTime === startTime);
                  const isSelected =
                    selectedNote?.pitch === pitch && selectedNote?.startTime === startTime;

                  return (
                    <Box
                      key={col}
                      onClick={() => handleCellClick(row, col)}
                      sx={{
                        width: 24,
                        height: 24,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: isSelected
                          ? 'primary.main'
                          : hasNote
                            ? 'primary.light'
                            : 'background.paper',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

MIDIEditor.propTypes = {
  track: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
};
