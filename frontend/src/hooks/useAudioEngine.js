import { useEffect, useRef, useState } from 'react';

export function useAudioEngine(initialParams = {}) {
  const audioContextRef = useRef(null);
  const nodesRef = useRef({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const defaultParams = {
    baseFrequency: 440,
    reverbLevel: 0.3,
    delayTime: 0.3,
    delayFeedback: 0.4,
    ...initialParams,
  };

  const [params, setParams] = useState(defaultParams);

  useEffect(() => {
    // Initialize audio context
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();

        // Create main gain node
        nodesRef.current.mainGain = audioContextRef.current.createGain();
        nodesRef.current.mainGain.connect(audioContextRef.current.destination);
        nodesRef.current.mainGain.gain.value = volume;

        // Create reverb
        const convolver = audioContextRef.current.createConvolver();
        nodesRef.current.reverbGain = audioContextRef.current.createGain();
        nodesRef.current.reverbGain.gain.value = params.reverbLevel;

        // Create impulse response for reverb
        const impulseLength = 2 * audioContextRef.current.sampleRate;
        const impulse = audioContextRef.current.createBuffer(
          2,
          impulseLength,
          audioContextRef.current.sampleRate
        );

        for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < impulseLength; i++) {
            channelData[i] =
              (Math.random() * 2 - 1) * Math.exp(-i / (impulseLength / 3));
          }
        }

        convolver.buffer = impulse;
        convolver.connect(nodesRef.current.reverbGain);
        nodesRef.current.reverbGain.connect(nodesRef.current.mainGain);
        nodesRef.current.convolver = convolver;

        // Create delay
        const delay = audioContextRef.current.createDelay();
        const delayFeedback = audioContextRef.current.createGain();
        delay.delayTime.value = params.delayTime;
        delayFeedback.gain.value = params.delayFeedback;

        delay.connect(delayFeedback);
        delayFeedback.connect(delay);
        delayFeedback.connect(nodesRef.current.mainGain);
        nodesRef.current.delay = delay;
        nodesRef.current.delayFeedback = delayFeedback;

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    if (!isInitialized) {
      initAudio();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (nodesRef.current.mainGain) {
      nodesRef.current.mainGain.gain.value = volume;
    }
  }, [volume]);

  const createTone = (frequency = params.baseFrequency, type = 'sine') => {
    if (!audioContextRef.current) return null;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(nodesRef.current.mainGain);
    gainNode.connect(nodesRef.current.convolver);
    gainNode.connect(nodesRef.current.delay);

    oscillator.start();

    return {
      oscillator,
      gainNode,
      setFrequency: freq => (oscillator.frequency.value = freq),
      setGain: value => (gainNode.gain.value = value),
      stop: () => {
        gainNode.gain.setValueAtTime(
          gainNode.gain.value,
          audioContextRef.current.currentTime
        );
        gainNode.gain.linearRampToValueAtTime(
          0,
          audioContextRef.current.currentTime + 0.1
        );
        setTimeout(() => {
          oscillator.stop();
          oscillator.disconnect();
          gainNode.disconnect();
        }, 100);
      },
    };
  };

  const updateParams = newParams => {
    setParams(prev => {
      const updated = { ...prev, ...newParams };

      if (nodesRef.current.reverbGain) {
        nodesRef.current.reverbGain.gain.value = updated.reverbLevel;
      }
      if (nodesRef.current.delay) {
        nodesRef.current.delay.delayTime.value = updated.delayTime;
      }
      if (nodesRef.current.delayFeedback) {
        nodesRef.current.delayFeedback.gain.value = updated.delayFeedback;
      }

      return updated;
    });
  };

  const resume = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  return {
    isInitialized,
    volume,
    params,
    setVolume,
    createTone,
    updateParams,
    resume,
  };
}
