import { useCallback, useEffect, useRef, useState } from 'react';

const FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.8;

const useAudioAnalyzer = audioUrl => {
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyzerNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioElementRef = useRef(null);
  const frequencyDataRef = useRef(new Uint8Array(FFT_SIZE / 2));
  const waveformDataRef = useRef(new Uint8Array(FFT_SIZE));
  const rafIdRef = useRef(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  // Initialize audio context and nodes
  const initializeAudio = useCallback(async () => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create audio element
      const audioElement = new Audio();
      audioElement.crossOrigin = 'anonymous';
      audioElement.src = audioUrl;
      audioElementRef.current = audioElement;

      // Create nodes
      const sourceNode = audioContextRef.current.createMediaElementSource(audioElement);
      sourceNodeRef.current = sourceNode;

      const analyzerNode = audioContextRef.current.createAnalyser();
      analyzerNode.fftSize = FFT_SIZE;
      analyzerNode.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
      analyzerNodeRef.current = analyzerNode;

      const gainNode = audioContextRef.current.createGain();
      gainNodeRef.current = gainNode;

      // Connect nodes
      sourceNode
        .connect(analyzerNode)
        .connect(gainNode)
        .connect(audioContextRef.current.destination);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
    }
  }, [audioUrl]);

  // Start/resume audio context
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Play audio
  const play = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    await resumeAudioContext();
    await audioElementRef.current.play();
    setIsPlaying(true);
  }, [isInitialized, initializeAudio, resumeAudioContext]);

  // Pause audio
  const pause = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Set volume
  const setAudioVolume = useCallback(newVolume => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
      setVolume(newVolume);
    }
  }, []);

  // Get frequency data
  const getFrequencyData = useCallback(() => {
    if (analyzerNodeRef.current) {
      analyzerNodeRef.current.getByteFrequencyData(frequencyDataRef.current);
      return frequencyDataRef.current;
    }
    return new Uint8Array(FFT_SIZE / 2);
  }, []);

  // Get waveform data
  const getTimeDomainData = useCallback(() => {
    if (analyzerNodeRef.current) {
      analyzerNodeRef.current.getByteTimeDomainData(waveformDataRef.current);
      return waveformDataRef.current;
    }
    return new Uint8Array(FFT_SIZE);
  }, []);

  // Get average frequency for a range
  const getAverageFrequency = useCallback(
    (startFreq, endFreq) => {
      if (!analyzerNodeRef.current) return 0;

      const frequencyData = getFrequencyData();
      const nyquist = audioContextRef.current.sampleRate / 2;
      const startIndex = Math.floor((startFreq / nyquist) * (FFT_SIZE / 2));
      const endIndex = Math.floor((endFreq / nyquist) * (FFT_SIZE / 2));
      let sum = 0;

      for (let i = startIndex; i <= endIndex; i++) {
        sum += frequencyData[i];
      }

      return sum / (endIndex - startIndex + 1);
    },
    [getFrequencyData]
  );

  // Get frequency bands (bass, mid, treble)
  const getFrequencyBands = useCallback(() => {
    return {
      bass: getAverageFrequency(20, 250),
      mid: getAverageFrequency(250, 2000),
      treble: getAverageFrequency(2000, 16000),
    };
  }, [getAverageFrequency]);

  // Clean up
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.remove();
      }
    };
  }, []);

  // Initialize on mount if audioUrl is provided
  useEffect(() => {
    if (audioUrl && !isInitialized) {
      initializeAudio();
    }
  }, [audioUrl, isInitialized, initializeAudio]);

  return {
    isInitialized,
    isPlaying,
    volume,
    play,
    pause,
    setVolume: setAudioVolume,
    getFrequencyData,
    getTimeDomainData,
    getFrequencyBands,
    getAverageFrequency,
  };
};

export default useAudioAnalyzer;
