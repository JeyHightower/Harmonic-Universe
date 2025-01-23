import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Tone from 'tone';
import { setAudioContext, setIsPlaying } from '../../store/slices/musicSlice';
import styles from './AudioController.module.css';

const AudioController = ({ physicsParameters }) => {
  const dispatch = useDispatch();
  const { isPlaying } = useSelector(state => state.music);
  const [volume, setVolume] = useState(-12);
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
    if (!physicsParameters) return;

    // Map physics parameters to musical properties
    const updateMusicParameters = () => {
      if (!synthRef.current) return;

      // Map gravity to base frequency
      const baseFreq = Tone.Frequency(
        Math.max(50, Math.min(1000, physicsParameters.gravity * 50)),
        'hz'
      );

      // Map elasticity to note duration
      const noteDuration = Math.max(
        0.1,
        Math.min(2, physicsParameters.elasticity * 2)
      );

      // Map friction to filter cutoff
      const filterFreq = Math.max(
        200,
        Math.min(10000, (1 - physicsParameters.friction) * 10000)
      );

      // Map air resistance to reverb
      const reverbAmount = Math.max(
        0,
        Math.min(0.9, physicsParameters.airResistance)
      );

      // Map density to harmonicity
      const harmonicity = Math.max(
        0.5,
        Math.min(4, physicsParameters.density * 2)
      );

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
          frequency: filterFreq,
        },
      });

      // Create or update sequencer
      if (sequencerRef.current) {
        sequencerRef.current.dispose();
      }

      const notes = ['C4', 'E4', 'G4', 'B4'].map(note =>
        Tone.Frequency(note).harmonize(harmonicity)
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
  }, [physicsParameters, isPlaying]);

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
          <label>Frequency Base</label>
          <span>{Math.round(physicsParameters?.gravity * 50)} Hz</span>
        </div>
        <div className={styles.parameter}>
          <label>Note Duration</label>
          <span>{(physicsParameters?.elasticity * 2).toFixed(2)} s</span>
        </div>
        <div className={styles.parameter}>
          <label>Filter Cutoff</label>
          <span>
            {Math.round((1 - physicsParameters?.friction) * 10000)} Hz
          </span>
        </div>
        <div className={styles.parameter}>
          <label>Reverb</label>
          <span>{(physicsParameters?.airResistance * 100).toFixed(0)}%</span>
        </div>
        <div className={styles.parameter}>
          <label>Harmonicity</label>
          <span>{(physicsParameters?.density * 2).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioController;
