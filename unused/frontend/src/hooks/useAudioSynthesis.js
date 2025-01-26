import { useCallback, useEffect, useState } from "react";

const useAudioSynthesis = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [oscillator, setOscillator] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize audio context
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    // Create gain node
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    setGainNode(gain);

    return () => {
      if (ctx) {
        ctx.close();
      }
    };
  }, []);

  const startSound = useCallback(
    (parameters) => {
      if (!audioContext || isPlaying) return;

      const osc = audioContext.createOscillator();
      const filter = audioContext.createBiquadFilter();
      const delay = audioContext.createDelay();
      const delayGain = audioContext.createGain();
      const reverbNode = audioContext.createConvolver();

      // Configure oscillator
      osc.type = parameters.waveform;
      osc.frequency.setValueAtTime(
        440 * Math.pow(2, (parameters.pitch || 0) / 12),
        audioContext.currentTime,
      );

      // Configure filter
      filter.type = "lowpass";
      filter.frequency.value = parameters.filterFreq;
      filter.Q.value = parameters.filterResonance;

      // Configure delay
      delay.delayTime.value = parameters.delay;
      delayGain.gain.value = parameters.delay * 0.5;

      // Configure reverb (simplified)
      const reverbTime = parameters.reverb * 2;
      const sampleRate = audioContext.sampleRate;
      const length = sampleRate * reverbTime;
      const impulse = audioContext.createBuffer(2, length, sampleRate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (sampleRate * parameters.reverb));
        impulseL[i] = (Math.random() * 2 - 1) * decay;
        impulseR[i] = (Math.random() * 2 - 1) * decay;
      }

      reverbNode.buffer = impulse;

      // Connect nodes
      osc.connect(filter);
      filter.connect(gainNode);
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(gainNode);
      filter.connect(reverbNode);
      reverbNode.connect(gainNode);

      // Set volume
      gainNode.gain.value = parameters.volume;

      // Start oscillator
      osc.start();
      setOscillator(osc);
      setIsPlaying(true);
    },
    [audioContext, gainNode, isPlaying],
  );

  const stopSound = useCallback(() => {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      setOscillator(null);
    }
    setIsPlaying(false);
  }, [oscillator]);

  const updateParameters = useCallback(
    (parameters) => {
      if (!oscillator || !gainNode) return;

      // Update oscillator
      oscillator.type = parameters.waveform;
      oscillator.frequency.setValueAtTime(
        440 * Math.pow(2, (parameters.pitch || 0) / 12),
        audioContext.currentTime,
      );

      // Update volume
      gainNode.gain.value = parameters.volume;
    },
    [oscillator, gainNode, audioContext],
  );

  return {
    startSound,
    stopSound,
    updateParameters,
    isPlaying,
  };
};

export default useAudioSynthesis;
