import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTrackNote,
  deleteTrackNote,
  selectActiveTrackId,
  selectTracks,
  updateTrackNotes,
} from '../../store/slices/audioSlice';
import MidiControls from './MidiControls';
import styles from './MusicWorkspace.module.css';
import PianoRoll from './PianoRoll';
import PresetManager from './PresetManager';
import ScaleSelector from './ScaleSelector';
import Spectrogram from './Spectrogram';
import TrackList from './TrackList';

const MusicWorkspace = () => {
  const dispatch = useDispatch();
  const tracks = useSelector(selectTracks);
  const activeTrackId = useSelector(selectActiveTrackId);
  const [error, setError] = useState(null);

  const activeTrack = tracks.find(track => track.id === activeTrackId);

  const handleNoteAdd = note => {
    if (!activeTrackId) {
      setError('Please select a track first');
      return;
    }
    dispatch(addTrackNote({ trackId: activeTrackId, note }));
  };

  const handleNoteUpdate = note => {
    if (!activeTrackId) return;
    dispatch(
      updateTrackNotes({
        trackId: activeTrackId,
        notes: activeTrack.notes.map(n => (n.id === note.id ? note : n)),
      })
    );
  };

  const handleNoteDelete = note => {
    if (!activeTrackId) return;
    dispatch(deleteTrackNote({ trackId: activeTrackId, noteId: note.id }));
  };

  const handleError = message => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.header}>
        <h2>Music Workspace</h2>
        <p>
          Create and edit musical sequences with advanced controls and
          visualizations
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <PresetManager onError={handleError} />
          <ScaleSelector />
          <TrackList />
          <MidiControls onError={handleError} />
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.visualizers}>
            {activeTrack && (
              <>
                <PianoRoll
                  notes={activeTrack.notes}
                  duration={activeTrack.duration || 8}
                  onNoteAdd={handleNoteAdd}
                  onNoteUpdate={handleNoteUpdate}
                  onNoteDelete={handleNoteDelete}
                />
                <Spectrogram analyser={activeTrack.analyser} />
              </>
            )}
            {!activeTrack && (
              <div className={styles.noTrack}>
                <p>Select a track to view and edit notes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicWorkspace;
