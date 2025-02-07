import { RootState } from '@store/index';
import { setCurrentTime, updateTrack } from '@store/slices/audioSlice';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface AudioEngineContext {
  audioContext: AudioContext;
  masterGain: GainNode;
}

interface AudioBuffer {
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  panNode: StereoPannerNode;
  effectNodes: AudioNode[];
}

export const useAudioEngine = () => {
  const dispatch = useDispatch();
  const { tracks, isPlaying, currentTime } = useSelector((state: RootState) => state.audio);
  const [engineContext, setEngineContext] = useState<AudioEngineContext | null>(null);
  const audioBuffers = useRef<Map<number, AudioBuffer>>(new Map());
  const rafId = useRef<number>();

  const initEngine = useCallback(() => {
    const audioContext = new AudioContext();
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    setEngineContext({ audioContext, masterGain });
    return { audioContext, masterGain };
  }, []);

  const loadAudioBuffer = useCallback(
    async (url: string) => {
      if (!engineContext) return null;

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await engineContext.audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
      } catch (error) {
        console.error('Error loading audio buffer:', error);
        return null;
      }
    },
    [engineContext]
  );

  const createTrack = useCallback(
    async (buffer: AudioBuffer, trackId: number) => {
      if (!engineContext) return;

      const source = engineContext.audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = engineContext.audioContext.createGain();
      const panNode = engineContext.audioContext.createStereoPanner();

      source.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(engineContext.masterGain);

      audioBuffers.current.set(trackId, {
        buffer,
        source,
        gainNode,
        panNode,
        effectNodes: [],
      });

      dispatch(
        updateTrack({
          id: trackId,
          is_playing: false,
        })
      );
    },
    [dispatch, engineContext]
  );

  const playTrack = useCallback(
    (trackId: number) => {
      const audioBuffer = audioBuffers.current.get(trackId);
      if (!audioBuffer || !engineContext) return;

      if (audioBuffer.source) {
        audioBuffer.source.stop();
      }

      const newSource = engineContext.audioContext.createBufferSource();
      newSource.buffer = audioBuffer.buffer;
      newSource.connect(audioBuffer.gainNode);
      newSource.start(0, currentTime);

      audioBuffer.source = newSource;
      audioBuffers.current.set(trackId, audioBuffer);

      dispatch(
        updateTrack({
          id: trackId,
          is_playing: true,
        })
      );
    },
    [currentTime, dispatch, engineContext]
  );

  const stopTrack = useCallback(
    (trackId: number) => {
      const audioBuffer = audioBuffers.current.get(trackId);
      if (!audioBuffer) return;

      if (audioBuffer.source) {
        audioBuffer.source.stop();
        audioBuffer.source = null;
      }

      dispatch(
        updateTrack({
          id: trackId,
          is_playing: false,
        })
      );
    },
    [dispatch]
  );

  const setTrackVolume = useCallback(
    (trackId: number, volume: number) => {
      const audioBuffer = audioBuffers.current.get(trackId);
      if (!audioBuffer) return;

      audioBuffer.gainNode.gain.value = volume;
      dispatch(
        updateTrack({
          id: trackId,
          volume,
        })
      );
    },
    [dispatch]
  );

  const setTrackPan = useCallback(
    (trackId: number, pan: number) => {
      const audioBuffer = audioBuffers.current.get(trackId);
      if (!audioBuffer) return;

      audioBuffer.panNode.pan.value = pan;
      dispatch(
        updateTrack({
          id: trackId,
          pan,
        })
      );
    },
    [dispatch]
  );

  const addEffect = useCallback((trackId: number, effect: AudioNode) => {
    const audioBuffer = audioBuffers.current.get(trackId);
    if (!audioBuffer) return;

    const lastNode =
      audioBuffer.effectNodes.length > 0
        ? audioBuffer.effectNodes[audioBuffer.effectNodes.length - 1]
        : audioBuffer.gainNode;

    lastNode.disconnect();
    lastNode.connect(effect);
    effect.connect(audioBuffer.panNode);

    audioBuffer.effectNodes.push(effect);
    audioBuffers.current.set(trackId, audioBuffer);
  }, []);

  const removeEffect = useCallback((trackId: number, index: number) => {
    const audioBuffer = audioBuffers.current.get(trackId);
    if (!audioBuffer) return;

    const effect = audioBuffer.effectNodes[index];
    if (!effect) return;

    const prevNode = index === 0 ? audioBuffer.gainNode : audioBuffer.effectNodes[index - 1];
    const nextNode =
      index === audioBuffer.effectNodes.length - 1
        ? audioBuffer.panNode
        : audioBuffer.effectNodes[index + 1];

    effect.disconnect();
    prevNode.disconnect();
    prevNode.connect(nextNode);

    audioBuffer.effectNodes.splice(index, 1);
    audioBuffers.current.set(trackId, audioBuffer);
  }, []);

  useEffect(() => {
    if (!engineContext) return;

    const updatePlaybackTime = () => {
      dispatch(setCurrentTime(engineContext.audioContext.currentTime));
      rafId.current = requestAnimationFrame(updatePlaybackTime);
    };

    if (isPlaying) {
      rafId.current = requestAnimationFrame(updatePlaybackTime);
    } else {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [dispatch, engineContext, isPlaying]);

  useEffect(() => {
    return () => {
      audioBuffers.current.forEach(audioBuffer => {
        if (audioBuffer.source) {
          audioBuffer.source.stop();
        }
        audioBuffer.effectNodes.forEach(effect => effect.disconnect());
        audioBuffer.gainNode.disconnect();
        audioBuffer.panNode.disconnect();
      });
      audioBuffers.current.clear();
    };
  }, []);

  return {
    initEngine,
    loadAudioBuffer,
    createTrack,
    playTrack,
    stopTrack,
    setTrackVolume,
    setTrackPan,
    addEffect,
    removeEffect,
    tracks,
  };
};
