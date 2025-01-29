import { configureStore } from '@reduxjs/toolkit';
import storyboardReducer, {
    createStoryboard,
    deleteStoryboard,
    fetchStoryboardById,
    fetchStoryboards,
    selectCurrentStoryboard,
    selectStoryboardError,
    selectStoryboardLoading,
    selectStoryboards,
    updateStoryboard,
} from '../../store/slices/storyboardSlice';

const mockStoryboard = {
  id: 1,
  universe_id: 1,
  title: 'Test Storyboard',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('storyboardSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        storyboard: storyboardReducer,
      },
    });
  });

  describe('selectors', () => {
    it('should select storyboards', () => {
      const state = store.getState();
      expect(selectStoryboards(state)).toBe(state.storyboard.storyboards);
    });

    it('should select current storyboard', () => {
      const state = store.getState();
      expect(selectCurrentStoryboard(state)).toBe(state.storyboard.currentStoryboard);
    });

    it('should select loading state', () => {
      const state = store.getState();
      expect(selectStoryboardLoading(state)).toBe(state.storyboard.isLoading);
    });

    it('should select error state', () => {
      const state = store.getState();
      expect(selectStoryboardError(state)).toBe(state.storyboard.error);
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().storyboard;
      expect(state.storyboards).toEqual([]);
      expect(state.currentStoryboard).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchStoryboards.pending', () => {
      store.dispatch(fetchStoryboards.pending(''));
      const state = store.getState().storyboard;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchStoryboards.fulfilled', () => {
      store.dispatch(fetchStoryboards.fulfilled([mockStoryboard], ''));
      const state = store.getState().storyboard;
      expect(state.storyboards).toEqual([mockStoryboard]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchStoryboards.rejected', () => {
      store.dispatch(fetchStoryboards.rejected(new Error('Failed to fetch'), ''));
      const state = store.getState().storyboard;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle fetchStoryboardById.fulfilled', () => {
      store.dispatch(fetchStoryboardById.fulfilled(mockStoryboard, '', 1));
      const state = store.getState().storyboard;
      expect(state.currentStoryboard).toEqual(mockStoryboard);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle createStoryboard.fulfilled', () => {
      store.dispatch(
        createStoryboard.fulfilled(mockStoryboard, '', {
          title: 'Test Storyboard',
          description: 'Test Description',
        })
      );
      const state = store.getState().storyboard;
      expect(state.storyboards).toContainEqual(mockStoryboard);
      expect(state.currentStoryboard).toEqual(mockStoryboard);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle updateStoryboard.fulfilled', () => {
      // First add a storyboard
      store.dispatch(fetchStoryboards.fulfilled([mockStoryboard], ''));

      // Then update it
      const updatedStoryboard = {
        ...mockStoryboard,
        title: 'Updated Storyboard',
      };
      store.dispatch(
        updateStoryboard.fulfilled(updatedStoryboard, '', {
          storyboardId: 1,
          storyboardData: { title: 'Updated Storyboard' },
        })
      );

      const state = store.getState().storyboard;
      expect(state.storyboards[0].title).toBe('Updated Storyboard');
      expect(state.currentStoryboard).toEqual(updatedStoryboard);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle deleteStoryboard.fulfilled', () => {
      // First add a storyboard
      store.dispatch(fetchStoryboards.fulfilled([mockStoryboard], ''));

      // Then delete it
      store.dispatch(deleteStoryboard.fulfilled(1, '', 1));

      const state = store.getState().storyboard;
      expect(state.storyboards).toHaveLength(0);
      expect(state.currentStoryboard).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });
});
