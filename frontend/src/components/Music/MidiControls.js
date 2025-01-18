import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MidiService from '../../services/MidiService';
import { selectTracks, setTracks } from '../../store/slices/audioSlice';
import styles from './MidiControls.module.css';

const MidiControls = ({ onError }) => {
  const dispatch = useDispatch();
  const tracks = useSelector(selectTracks);
  const fileInputRef = useRef(null);

  const handleImport = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const midiData = await MidiService.parseMidiFile(file);
      const sequences = MidiService.convertMidiToSequence(midiData);
      dispatch(setTracks(sequences));
    } catch (error) {
      onError?.(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    if (!tracks.length) {
      onError?.('No tracks available to export.');
      return;
    }

    try {
      const midiTracks = MidiService.convertSequenceToMidi(tracks);
      await MidiService.exportMidiFile(
        midiTracks,
        'harmonic_universe_sequence.mid'
      );
    } catch (error) {
      onError?.(error.message);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.midiControls}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mid,.midi"
        onChange={handleImport}
        className={styles.fileInput}
      />
      <div className={styles.buttons}>
        <button
          type="button"
          onClick={triggerFileInput}
          className={styles.importButton}
        >
          Import MIDI
        </button>
        <button
          type="button"
          onClick={handleExport}
          className={styles.exportButton}
          disabled={!tracks.length}
        >
          Export MIDI
        </button>
      </div>
    </div>
  );
};

MidiControls.propTypes = {
  onError: PropTypes.func,
};

MidiControls.defaultProps = {
  onError: undefined,
};

export default MidiControls;
