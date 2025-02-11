import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Tone from 'tone';
import { setAudioContext, setIsPlaying } from '../../redux/slices/musicSlice';
import styles from './AudioController.module.css';

const AudioController = () => {
  const dispatch = useDispatch();
  const { isPlaying } = useSelector(state => state.music);
  const [volume, setVolume] = useState(-12);
  const [frequency, setFrequency] = useState(440);
  const [noteDuration, setNoteDuration] = useState(0.5);
  const [filterCutoff, setFilterCutoff] = useState(5000);
  const synthRef = useRef(null);
  const sequencerRef = useRef(null);

  useEffect(() => {
    // Initialize Tone.js
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    synthRef.current.volume.value = volume;

    // Create audio context
    dispatch(setAudioContext(Tone.getContext()));

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequencerRef.current) {
        sequencerRef.current.dispose();
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Update music parameters
    const updateMusicParameters = () => {
      if (!synthRef.current) return;

      // Update synth parameters
      synthRef.current.set({
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: noteDuration * 0.2,
          decay: noteDuration * 0.3,
          sustain: 0.5,
          release: noteDuration * 0.5,
        },
        filter: {
          frequency: filterCutoff,
        },
      });

      // Create or update sequencer
      if (sequencerRef.current) {
        sequencerRef.current.dispose();
      }

      const notes = ['C4', 'E4', 'G4', 'B4'].map(note =>
        Tone.Frequency(note).transpose(frequency / 440)
      );

      sequencerRef.current = new Tone.Sequence(
        (time, note) => {
          synthRef.current.triggerAttackRelease(note, noteDuration, time);
        },
        notes,
        '4n'
      );

      if (isPlaying) {
        sequencerRef.current.start();
      }
    };

    updateMusicParameters();
  }, [frequency, noteDuration, filterCutoff, isPlaying]);

  const handlePlayPause = async () => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.start();
      if (sequencerRef.current) {
        sequencerRef.current.start();
      }
    } else {
      Tone.Transport.stop();
      if (sequencerRef.current) {
        sequencerRef.current.stop();
      }
    }
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleVolumeChange = e => {
    setVolume(parseFloat(e.target.value));
  };

  const handleFrequencyChange = e => {
    setFrequency(parseFloat(e.target.value));
  };

  const handleDurationChange = e => {
    setNoteDuration(parseFloat(e.target.value));
  };

  const handleFilterChange = e => {
    setFilterCutoff(parseFloat(e.target.value));
  };

  return (
    <div className={styles.audioController}>
      <div className={styles.controls}>
        <button
          className={`${styles.playButton} ${isPlaying ? styles.active : ''}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <div className={styles.volumeControl}>
          <label>Volume</label>
          <input
            type="range"
            min="-60"
            max="0"
            step="1"
            value={volume}
            onChange={handleVolumeChange}
          />
          <span>{volume} dB</span>
        </div>
      </div>

      <div className={styles.parameterDisplay}>
        <div className={styles.parameter}>
          <label>Base Frequency</label>
          <input
            type="range"
            min="220"
            max="880"
            step="1"
            value={frequency}
            onChange={handleFrequencyChange}
          />
          <span>{frequency} Hz</span>
        </div>
        <div className={styles.parameter}>
          <label>Note Duration</label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={noteDuration}
            onChange={handleDurationChange}
          />
          <span>{noteDuration.toFixed(1)} s</span>
        </div>
        <div className={styles.parameter}>
          <label>Filter Cutoff</label>
          <input
            type="range"
            min="200"
            max="10000"
            step="100"
            value={filterCutoff}
            onChange={handleFilterChange}
          />
          <span>{filterCutoff} Hz</span>
        </div>
      </div>
    </div>
  );
};

export default AudioController;
