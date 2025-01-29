import { configureStore } from '@reduxjs/toolkit';
import universeReducer, {
    createUniverse,
    deleteUniverse,
    fetchUniverseById,
    fetchUniverses,
    selectCurrentUniverse,
    selectUniverseError,
    selectUniverseLoading,
    selectUniverses,
    updateUniverse,
} from '../../store/slices/universeSlice';

const mockUniverse = {
  id: 1,
  user_id: 1,
  title: 'Test Universe',
  description: 'Test Description',
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('universeSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        universe: universeReducer,
      },
    });
  });

  describe('selectors', () => {
    it('should select universes', () => {
      const state = store.getState();
      expect(selectUniverses(state)).toBe(state.universe.universes);
    });

    it('should select current universe', () => {
      const state = store.getState();
      expect(selectCurrentUniverse(state)).toBe(state.universe.currentUniverse);
    });

    it('should select loading state', () => {
      const state = store.getState();
      expect(selectUniverseLoading(state)).toBe(state.universe.isLoading);
    });

    it('should select error state', () => {
      const state = store.getState();
      expect(selectUniverseError(state)).toBe(state.universe.error);
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().universe;
      expect(state.universes).toEqual([]);
      expect(state.currentUniverse).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchUniverses.pending', () => {
      store.dispatch(fetchUniverses.pending(''));
      const state = store.getState().universe;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchUniverses.fulfilled', () => {
      store.dispatch(fetchUniverses.fulfilled([mockUniverse], ''));
      const state = store.getState().universe;
      expect(state.universes).toEqual([mockUniverse]);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle fetchUniverses.rejected', () => {
      store.dispatch(fetchUniverses.rejected(new Error('Failed to fetch'), ''));
      const state = store.getState().universe;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Failed to fetch');
    });

    it('should handle fetchUniverseById.fulfilled', () => {
      store.dispatch(fetchUniverseById.fulfilled(mockUniverse, '', 1));
      const state = store.getState().universe;
      expect(state.currentUniverse).toEqual(mockUniverse);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle createUniverse.fulfilled', () => {
      store.dispatch(
        createUniverse.fulfilled(mockUniverse, '', {
          title: 'Test Universe',
          description: 'Test Description',
          is_public: true,
        })
      );
      const state = store.getState().universe;
      expect(state.universes).toContainEqual(mockUniverse);
      expect(state.currentUniverse).toEqual(mockUniverse);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle updateUniverse.fulfilled', () => {
      // First add a universe
      store.dispatch(fetchUniverses.fulfilled([mockUniverse], ''));

      // Then update it
      const updatedUniverse = {
        ...mockUniverse,
        title: 'Updated Universe',
      };
      store.dispatch(
        updateUniverse.fulfilled(updatedUniverse, '', {
          universeId: 1,
          universeData: { title: 'Updated Universe' },
        })
      );

      const state = store.getState().universe;
      expect(state.universes[0].title).toBe('Updated Universe');
      expect(state.currentUniverse).toEqual(updatedUniverse);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle deleteUniverse.fulfilled', () => {
      // First add a universe
      store.dispatch(fetchUniverses.fulfilled([mockUniverse], ''));

      // Then delete it
      store.dispatch(deleteUniverse.fulfilled(1, '', 1));

      const state = store.getState().universe;
      expect(state.universes).toHaveLength(0);
      expect(state.currentUniverse).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });
});
