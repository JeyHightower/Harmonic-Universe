import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectParameters,
  updateParameters,
} from "../../store/slices/audioSlice";
import styles from "./ScaleSelector.module.css";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Pentatonic: [0, 2, 4, 7, 9],
  Blues: [0, 3, 5, 6, 7, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const CHORD_PROGRESSIONS = {
  "I-IV-V": [0, 3, 4],
  "I-V-vi-IV": [0, 4, 5, 3],
  "ii-V-I": [1, 4, 0],
  "I-vi-IV-V": [0, 5, 3, 4],
  "Blues (I-IV-I-V-IV-I)": [0, 3, 0, 4, 3, 0],
};

const ScaleSelector = () => {
  const dispatch = useDispatch();
  const parameters = useSelector(selectParameters);
  const { rootNote, scale, chordProgression } = parameters;

  const handleRootChange = (event) => {
    const newRoot = event.target.value;
    dispatch(updateParameters({ rootNote: newRoot }));
  };

  const handleScaleChange = (event) => {
    const newScale = event.target.value;
    dispatch(updateParameters({ scale: newScale }));
  };

  const handleProgressionChange = (event) => {
    const newProgression = event.target.value;
    dispatch(updateParameters({ chordProgression: newProgression }));
  };

  const getScaleNotes = () => {
    const scalePattern = SCALES[scale] || SCALES.Major;
    const rootIndex = NOTES.indexOf(rootNote.slice(0, -1));
    return scalePattern.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  };

  const getChordProgression = () => {
    const progression =
      CHORD_PROGRESSIONS[chordProgression] || CHORD_PROGRESSIONS["I-IV-V"];
    const scalePattern = SCALES[scale] || SCALES.Major;
    const rootIndex = NOTES.indexOf(rootNote.slice(0, -1));

    return progression.map((degree) => {
      const chordRoot = (rootIndex + scalePattern[degree]) % 12;
      return NOTES[chordRoot];
    });
  };

  return (
    <div className={styles.scaleSelector}>
      <h3>Scale & Harmony</h3>

      <div className={styles.section}>
        <div className={styles.control}>
          <label htmlFor="rootNote">Root Note</label>
          <select
            id="rootNote"
            value={rootNote.slice(0, -1)}
            onChange={handleRootChange}
          >
            {NOTES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.control}>
          <label htmlFor="scale">Scale</label>
          <select id="scale" value={scale} onChange={handleScaleChange}>
            {Object.keys(SCALES).map((scaleName) => (
              <option key={scaleName} value={scaleName}>
                {scaleName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.control}>
          <label htmlFor="progression">Chord Progression</label>
          <select
            id="progression"
            value={chordProgression}
            onChange={handleProgressionChange}
          >
            {Object.keys(CHORD_PROGRESSIONS).map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.scaleNotes}>
          <h4>Scale Notes</h4>
          <div className={styles.noteList}>
            {getScaleNotes().map((note, index) => (
              <span key={index} className={styles.note}>
                {note}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.chordProgression}>
          <h4>Progression</h4>
          <div className={styles.chordList}>
            {getChordProgression().map((note, index) => (
              <span key={index} className={styles.chord}>
                {note}
                <small>
                  {Object.keys(CHORD_PROGRESSIONS[chordProgression])[index]}
                </small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScaleSelector;
