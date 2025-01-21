import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectCurrentSequence,
  selectIsPlaying,
} from '../../store/slices/audioSlice';
import styles from './SequenceDisplay.module.css';

const SequenceDisplay = () => {
  const sequence = useSelector(selectCurrentSequence);
  const isPlaying = useSelector(selectIsPlaying);

  if (!sequence) {
    return (
      <div className={styles.empty}>
        <i className="fas fa-music" />
        <span>Generate a sequence to begin</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Current Sequence</h3>
      <div className={styles.sequence}>
        {sequence.map((note, index) => (
          <div
            key={index}
            className={`${styles.note} ${note ? styles.active : styles.rest}`}
            title={note || 'Rest'}
          >
            <div className={styles.noteContent}>
              {note ? (
                <>
                  <span className={styles.noteName}>{note.slice(0, -1)}</span>
                  <span className={styles.octave}>{note.slice(-1)}</span>
                </>
              ) : (
                <span className={styles.rest}>-</span>
              )}
            </div>
            <div className={styles.step}>{index + 1}</div>
          </div>
        ))}
      </div>
      {isPlaying && (
        <div className={styles.playhead} style={{ animationDuration: '2s' }} />
      )}
    </div>
  );
};

export default SequenceDisplay;
