import { configureStore } from '@reduxjs/toolkit';
import sceneReducer, {
    createScene,
    deleteScene,
    fetchSceneById,
    fetchScenes,
    reorderScenes,
    selectCurrentScene,
    selectSceneError,
    selectSceneLoading,
    selectScenes,
    updateScene,
} from '../../store/slices/sceneSlice';

const mockScene = {
  id: 1,
  storyboard_id: 1,
  sequence_number: 1,
  title: 'Test Scene',
  content: 'Test Content',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('sceneSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        scene: sceneReducer,
      },
    });
  });

  describe('selectors', () => {
    it('should select scenes', () => {
      const state = store.getState();
      expect(selectScenes(state)).toBe(state.scene.scenes);
    });

    it('should select current scene', () => {
      const state = store.getState();
      expect(selectCurrentScene(state)).toBe(state.scene.currentScene);
    });

    it('should select loading state', () => {
      const state = store.getState();
      expect(selectSceneLoading(state)).toBe(state.scene.isLoading);
    });

    it('should select error state', () => {
      const state = store.getState();
      expect(selectSceneError(state)).toBe(state.scene.error);
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().scene;
      expect(state.scenes).toEqual([]);
      expect(state.currentScene).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchScenes.pending', () => {
      store.dispatch(fetchScenes.pending(''));
      const state = store.getState().scene;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchScenes.fulfilled', () => {
      store.dispatch(fetchScenes.fulfilled([mockScene], ''));
      const state = store.getState().scene;
      expect(state.scenes).toEqual([mockScene]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchScenes.rejected', () => {
      store.dispatch(fetchScenes.rejected(new Error('Failed to fetch'), ''));
      const state = store.getState().scene;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle fetchSceneById.fulfilled', () => {
      store.dispatch(fetchSceneById.fulfilled(mockScene, '', 1));
      const state = store.getState().scene;
      expect(state.currentScene).toEqual(mockScene);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle createScene.fulfilled', () => {
      store.dispatch(
        createScene.fulfilled(mockScene, '', {
          title: 'Test Scene',
          content: 'Test Content',
          sequence_number: 1,
        })
      );
      const state = store.getState().scene;
      expect(state.scenes).toContainEqual(mockScene);
      expect(state.currentScene).toEqual(mockScene);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle updateScene.fulfilled', () => {
      // First add a scene
      store.dispatch(fetchScenes.fulfilled([mockScene], ''));

      // Then update it
      const updatedScene = {
        ...mockScene,
        title: 'Updated Scene',
      };
      store.dispatch(
        updateScene.fulfilled(updatedScene, '', {
          sceneId: 1,
          sceneData: { title: 'Updated Scene' },
        })
      );

      const state = store.getState().scene;
      expect(state.scenes[0].title).toBe('Updated Scene');
      expect(state.currentScene).toEqual(updatedScene);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle deleteScene.fulfilled', () => {
      // First add a scene
      store.dispatch(fetchScenes.fulfilled([mockScene], ''));

      // Then delete it
      store.dispatch(deleteScene.fulfilled(1, '', 1));

      const state = store.getState().scene;
      expect(state.scenes).toHaveLength(0);
      expect(state.currentScene).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle reorderScenes.fulfilled', () => {
      const scenes = [
        { ...mockScene, id: 1, sequence_number: 1 },
        { ...mockScene, id: 2, sequence_number: 2 },
      ];

      // First add scenes
      store.dispatch(fetchScenes.fulfilled(scenes, ''));

      // Then reorder them
      const reorderedScenes = [
        { ...mockScene, id: 2, sequence_number: 1 },
        { ...mockScene, id: 1, sequence_number: 2 },
      ];
      store.dispatch(reorderScenes.fulfilled(reorderedScenes, '', {
        storyboardId: 1,
        sceneIds: [2, 1],
      }));

      const state = store.getState().scene;
      expect(state.scenes).toEqual(reorderedScenes);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });
});
