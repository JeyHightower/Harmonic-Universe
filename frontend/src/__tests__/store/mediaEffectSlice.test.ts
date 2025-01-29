import { configureStore } from '@reduxjs/toolkit';
import mediaEffectReducer, {
    createAudioTrack,
    createVisualEffect,
    deleteAudioTrack,
    deleteVisualEffect,
    fetchAudioTracks,
    fetchVisualEffects,
    selectAudioTracks,
    selectMediaEffectError,
    selectMediaEffectLoading,
    selectVisualEffects,
    updateAudioTrack,
    updateVisualEffect,
} from '../../store/slices/mediaEffectSlice';

const mockVisualEffect = {
  id: 1,
  scene_id: 1,
  effect_type: 'fade',
  parameters: { duration: 1000 },
  start_time: 0,
  end_time: 1000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAudioTrack = {
  id: 1,
  scene_id: 1,
  audio_url: 'https://example.com/audio.mp3',
  volume: 1.0,
  start_time: 0,
  end_time: 5000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('mediaEffectSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        mediaEffect: mediaEffectReducer,
      },
    });
  });

  describe('selectors', () => {
    it('should select visual effects', () => {
      const state = store.getState();
      expect(selectVisualEffects(state)).toBe(state.mediaEffect.visualEffects);
    });

    it('should select audio tracks', () => {
      const state = store.getState();
      expect(selectAudioTracks(state)).toBe(state.mediaEffect.audioTracks);
    });

    it('should select loading state', () => {
      const state = store.getState();
      expect(selectMediaEffectLoading(state)).toBe(state.mediaEffect.isLoading);
    });

    it('should select error state', () => {
      const state = store.getState();
      expect(selectMediaEffectError(state)).toBe(state.mediaEffect.error);
    });
  });

  describe('visual effect reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().mediaEffect;
      expect(state.visualEffects).toEqual([]);
      expect(state.audioTracks).toEqual([]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchVisualEffects.pending', () => {
      store.dispatch(fetchVisualEffects.pending(''));
      const state = store.getState().mediaEffect;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchVisualEffects.fulfilled', () => {
      store.dispatch(fetchVisualEffects.fulfilled([mockVisualEffect], ''));
      const state = store.getState().mediaEffect;
      expect(state.visualEffects).toEqual([mockVisualEffect]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchVisualEffects.rejected', () => {
      store.dispatch(fetchVisualEffects.rejected(new Error('Failed to fetch'), ''));
      const state = store.getState().mediaEffect;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle createVisualEffect.fulfilled', () => {
      store.dispatch(
        createVisualEffect.fulfilled(mockVisualEffect, '', {
          effect_type: 'fade',
          parameters: { duration: 1000 },
          start_time: 0,
          end_time: 1000,
        })
      );
      const state = store.getState().mediaEffect;
      expect(state.visualEffects).toContainEqual(mockVisualEffect);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle updateVisualEffect.fulfilled', () => {
      // First add a visual effect
      store.dispatch(fetchVisualEffects.fulfilled([mockVisualEffect], ''));

      // Then update it
      const updatedEffect = {
        ...mockVisualEffect,
        parameters: { duration: 2000 },
      };
      store.dispatch(
        updateVisualEffect.fulfilled(updatedEffect, '', {
          effectId: 1,
          effectData: { parameters: { duration: 2000 } },
        })
      );

      const state = store.getState().mediaEffect;
      expect(state.visualEffects[0].parameters.duration).toBe(2000);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle deleteVisualEffect.fulfilled', () => {
      // First add a visual effect
      store.dispatch(fetchVisualEffects.fulfilled([mockVisualEffect], ''));

      // Then delete it
      store.dispatch(deleteVisualEffect.fulfilled(1, '', 1));

      const state = store.getState().mediaEffect;
      expect(state.visualEffects).toHaveLength(0);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });

  describe('audio track reducers', () => {
    it('should handle fetchAudioTracks.pending', () => {
      store.dispatch(fetchAudioTracks.pending(''));
      const state = store.getState().mediaEffect;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchAudioTracks.fulfilled', () => {
      store.dispatch(fetchAudioTracks.fulfilled([mockAudioTrack], ''));
      const state = store.getState().mediaEffect;
      expect(state.audioTracks).toEqual([mockAudioTrack]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchAudioTracks.rejected', () => {
      store.dispatch(fetchAudioTracks.rejected(new Error('Failed to fetch'), ''));
      const state = store.getState().mediaEffect;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle createAudioTrack.fulfilled', () => {
      store.dispatch(
        createAudioTrack.fulfilled(mockAudioTrack, '', {
          audio_url: 'https://example.com/audio.mp3',
          volume: 1.0,
          start_time: 0,
          end_time: 5000,
        })
      );
      const state = store.getState().mediaEffect;
      expect(state.audioTracks).toContainEqual(mockAudioTrack);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle updateAudioTrack.fulfilled', () => {
      // First add an audio track
      store.dispatch(fetchAudioTracks.fulfilled([mockAudioTrack], ''));

      // Then update it
      const updatedTrack = {
        ...mockAudioTrack,
        volume: 0.5,
      };
      store.dispatch(
        updateAudioTrack.fulfilled(updatedTrack, '', {
          trackId: 1,
          trackData: { volume: 0.5 },
        })
      );

      const state = store.getState().mediaEffect;
      expect(state.audioTracks[0].volume).toBe(0.5);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle deleteAudioTrack.fulfilled', () => {
      // First add an audio track
      store.dispatch(fetchAudioTracks.fulfilled([mockAudioTrack], ''));

      // Then delete it
      store.dispatch(deleteAudioTrack.fulfilled(1, '', 1));

      const state = store.getState().mediaEffect;
      expect(state.audioTracks).toHaveLength(0);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });
});
