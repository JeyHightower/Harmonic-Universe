import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AudioEngine from '../../services/AudioEngine';
import {
  addScheduledNote,
  clearScheduledNotes,
  setBpm,
  setError,
  setPlayingStatus,
} from '../../store/audio';

export const useAudioEngine = () => {
  const dispatch = useDispatch();
  const audioEngineRef = useRef(null);
  const { isPlaying, bpm, volume, scheduledNotes } = useSelector(
    state => state.audio
  );

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
    };
  }, []);

  const startAudio = async () => {
    try {
      await audioEngineRef.current.start();
      dispatch(setPlayingStatus(true));
    } catch (error) {
      dispatch(setError('Failed to start audio engine'));
    }
  };

  const stopAudio = () => {
    try {
      audioEngineRef.current.stop();
      dispatch(setPlayingStatus(false));
    } catch (error) {
      dispatch(setError('Failed to stop audio engine'));
    }
  };

  const scheduleNote = (note, time) => {
    try {
      const eventId = audioEngineRef.current.scheduleNote(note, time);
      dispatch(addScheduledNote({ note, time, eventId }));
    } catch (error) {
      dispatch(setError('Failed to schedule note'));
    }
  };

  const clearScheduled = () => {
    try {
      audioEngineRef.current.clearScheduledEvents();
      dispatch(clearScheduledNotes());
    } catch (error) {
      dispatch(setError('Failed to clear scheduled notes'));
    }
  };

  const updateBpm = newBpm => {
    try {
      audioEngineRef.current.setBPM(newBpm);
      dispatch(setBpm(newBpm));
    } catch (error) {
      dispatch(setError('Failed to update BPM'));
    }
  };

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setBPM(bpm);
    }
  }, [bpm]);

  return {
    isPlaying,
    bpm,
    volume,
    scheduledNotes,
    startAudio,
    stopAudio,
    scheduleNote,
    clearScheduled,
    updateBpm,
  };
};

export default useAudioEngine;
