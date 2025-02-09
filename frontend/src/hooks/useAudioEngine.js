import { setCurrentTime, setDuration, setIsPlaying, setVolume } from '@/store/slices/audioSlice';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

export const useAudioEngine = () => {
  const dispatch = useDispatch();
  const engineState = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeEngine = useCallback(() => {
    if (!engineState.current) {
      const audioContext = new AudioContext();
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);

      engineState.current = {
        audioContext,
        masterGain,
        tracks: new Map(),
      };

      setIsInitialized(true);
    }
    return engineState.current;
  }, []);

  const loadTrack = useCallback(
    async track => {
      if (!engineState.current) return;

      const { audioContext, tracks } = engineState.current;

      // If track is already loaded, return
      if (tracks.has(track.id)) return;

      try {
        const response = await fetch(track.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const gainNode = audioContext.createGain();
        gainNode.connect(engineState.current.masterGain);
        gainNode.gain.value = track.volume;

        tracks.set(track.id, {
          source: null,
          gainNode,
          buffer: audioBuffer,
        });

        dispatch(setDuration(audioBuffer.duration));
      } catch (error) {
        console.error('Error loading track:', error);
      }
    },
    [dispatch]
  );

  const playTrack = useCallback(
    track => {
      if (!engineState.current) return;

      const { audioContext, tracks } = engineState.current;
      const trackData = tracks.get(track.id);

      if (!trackData || !trackData.buffer) return;

      // Stop any existing playback
      if (trackData.source) {
        trackData.source.stop();
        trackData.source.disconnect();
      }

      // Create and configure new source
      const source = audioContext.createBufferSource();
      source.buffer = trackData.buffer;
      source.connect(trackData.gainNode);

      // Update track data with new source
      trackData.source = source;

      // Start playback
      source.start(0);
      dispatch(setIsPlaying(true));

      // Set up ended callback
      source.onended = () => {
        dispatch(setIsPlaying(false));
        dispatch(setCurrentTime(0));
      };
    },
    [dispatch]
  );

  const stopTrack = useCallback(
    trackId => {
      if (!engineState.current) return;

      const trackData = engineState.current.tracks.get(trackId);
      if (trackData?.source) {
        trackData.source.stop();
        trackData.source.disconnect();
        trackData.source = null;
      }

      dispatch(setIsPlaying(false));
      dispatch(setCurrentTime(0));
    },
    [dispatch]
  );

  const setTrackVolume = useCallback((trackId, volume) => {
    if (!engineState.current) return;

    const trackData = engineState.current.tracks.get(trackId);
    if (trackData) {
      trackData.gainNode.gain.value = volume;
    }
  }, []);

  const setMasterVolume = useCallback(
    volume => {
      if (!engineState.current) return;
      engineState.current.masterGain.gain.value = volume;
      dispatch(setVolume(volume));
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (engineState.current) {
        engineState.current.tracks.forEach(trackData => {
          if (trackData.source) {
            trackData.source.stop();
            trackData.source.disconnect();
          }
          trackData.gainNode.disconnect();
        });
        engineState.current.masterGain.disconnect();
        engineState.current.audioContext.close();
      }
    };
  }, []);

  return {
    isInitialized,
    initializeEngine,
    loadTrack,
    playTrack,
    stopTrack,
    setTrackVolume,
    setMasterVolume,
  };
};
