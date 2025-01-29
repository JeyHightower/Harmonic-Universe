import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useUniverseSocket } from './useUniverseSocket';

export interface Scene {
  id: number;
  title: string;
  sequence: number;
  content: {
    duration: number;
    [key: string]: any;
  };
  visual_effects: VisualEffect[];
  audio_tracks: AudioTrack[];
}

export interface VisualEffect {
  id: number;
  effect_type: string;
  parameters: Record<string, any>;
  start_time: number;
  duration: number;
}

export interface AudioTrack {
  id: number;
  track_type: string;
  parameters: Record<string, any>;
  start_time: number;
  duration: number;
  volume: number;
}

export interface Storyboard {
  id: number;
  universe_id: number;
  title: string;
  description: string;
  metadata: Record<string, any>;
  scenes: Scene[];
}

interface StoryboardState {
  currentTime: number;
  isPlaying: boolean;
  selectedSceneId: number | null;
  storyboard: Storyboard | null;
  loading: boolean;
  error: string | null;
}

export function useStoryboard(universeId: number, storyboardId: number) {
  const [state, setState] = useState<StoryboardState>({
    currentTime: 0,
    isPlaying: false,
    selectedSceneId: null,
    storyboard: null,
    loading: true,
    error: null,
  });

  // Socket connection for real-time updates
  const { socket, connected } = useUniverseSocket({
    universeId,
    onPhysicsUpdated: params => {
      // Handle physics updates that might affect visual effects
    },
  });

  // Fetch storyboard data
  const fetchStoryboard = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get(`/storyboards/${storyboardId}`);
      setState(prev => ({
        ...prev,
        storyboard: response.data,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load storyboard',
        loading: false,
      }));
    }
  }, [storyboardId]);

  // Initialize storyboard
  useEffect(() => {
    fetchStoryboard();
  }, [fetchStoryboard]);

  // Scene management
  const addScene = async (title: string) => {
    try {
      const response = await api.post(`/storyboards/${storyboardId}/scenes`, {
        title,
        sequence: state.storyboard?.scenes.length ?? 0 + 1,
      });

      setState(prev => ({
        ...prev,
        storyboard: prev.storyboard
          ? {
              ...prev.storyboard,
              scenes: [...prev.storyboard.scenes, response.data],
            }
          : null,
      }));

      socket?.emit('scene_added', {
        storyboard_id: storyboardId,
        scene: response.data,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to add scene',
      }));
    }
  };

  const updateScene = async (sceneId: number, updates: Partial<Scene>) => {
    try {
      const response = await api.put(`/scenes/${sceneId}`, updates);

      setState(prev => ({
        ...prev,
        storyboard: prev.storyboard
          ? {
              ...prev.storyboard,
              scenes: prev.storyboard.scenes.map(scene =>
                scene.id === sceneId ? { ...scene, ...response.data } : scene
              ),
            }
          : null,
      }));

      socket?.emit('scene_updated', {
        storyboard_id: storyboardId,
        scene: response.data,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to update scene',
      }));
    }
  };

  const reorderScenes = async (sceneIds: number[]) => {
    try {
      await api.put(`/storyboards/${storyboardId}/scenes/reorder`, {
        scene_order: sceneIds,
      });

      setState(prev => ({
        ...prev,
        storyboard: prev.storyboard
          ? {
              ...prev.storyboard,
              scenes: sceneIds.map((id, index) => {
                const scene = prev.storyboard!.scenes.find(s => s.id === id);
                return scene ? { ...scene, sequence: index + 1 } : scene!;
              }),
            }
          : null,
      }));

      socket?.emit('scenes_reordered', {
        storyboard_id: storyboardId,
        scene_order: sceneIds,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to reorder scenes',
      }));
    }
  };

  // Media management
  const addVisualEffect = async (
    sceneId: number,
    effect: Partial<VisualEffect>
  ) => {
    try {
      const response = await api.post(
        `/scenes/${sceneId}/visual-effects`,
        effect
      );

      setState(prev => ({
        ...prev,
        storyboard: prev.storyboard
          ? {
              ...prev.storyboard,
              scenes: prev.storyboard.scenes.map(scene =>
                scene.id === sceneId
                  ? {
                      ...scene,
                      visual_effects: [...scene.visual_effects, response.data],
                    }
                  : scene
              ),
            }
          : null,
      }));

      socket?.emit('visual_effect_added', {
        storyboard_id: storyboardId,
        scene_id: sceneId,
        effect: response.data,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to add visual effect',
      }));
    }
  };

  const addAudioTrack = async (sceneId: number, track: Partial<AudioTrack>) => {
    try {
      const response = await api.post(`/scenes/${sceneId}/audio-tracks`, track);

      setState(prev => ({
        ...prev,
        storyboard: prev.storyboard
          ? {
              ...prev.storyboard,
              scenes: prev.storyboard.scenes.map(scene =>
                scene.id === sceneId
                  ? {
                      ...scene,
                      audio_tracks: [...scene.audio_tracks, response.data],
                    }
                  : scene
              ),
            }
          : null,
      }));

      socket?.emit('audio_track_added', {
        storyboard_id: storyboardId,
        scene_id: sceneId,
        track: response.data,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to add audio track',
      }));
    }
  };

  // Playback controls
  const play = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const pause = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const seek = (time: number) => {
    setState(prev => ({ ...prev, currentTime: time }));
  };

  const selectScene = (sceneId: number) => {
    setState(prev => ({ ...prev, selectedSceneId: sceneId }));
  };

  return {
    ...state,
    addScene,
    updateScene,
    reorderScenes,
    addVisualEffect,
    addAudioTrack,
    play,
    pause,
    seek,
    selectScene,
    connected,
  };
}
