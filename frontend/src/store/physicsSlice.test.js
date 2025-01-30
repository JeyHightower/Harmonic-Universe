import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import physicsReducer, {
    clearError,
    createPhysicsObject,
    deletePhysicsObject,
    resetPhysics,
    selectPhysicsConstraints,
    selectPhysicsError,
    selectPhysicsLoading,
    selectPhysicsObjects,
    selectSimulationInProgress,
    simulateScene,
    updatePhysicsObject
} from './physicsSlice';

const mockStore = configureStore([thunk]);

describe('physicsSlice', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      physics: {
        objects: {},
        constraints: {},
        loading: false,
        error: null,
        simulationInProgress: false
      }
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      expect(physicsReducer(undefined, { type: 'unknown' })).toEqual({
        objects: {},
        constraints: {},
        loading: false,
        error: null,
        simulationInProgress: false
      });
    });

    it('should handle clearError', () => {
      const initialState = {
        objects: {},
        constraints: {},
        loading: false,
        error: 'Test error',
        simulationInProgress: false
      };

      expect(physicsReducer(initialState, clearError())).toEqual({
        ...initialState,
        error: null
      });
    });

    it('should handle resetPhysics', () => {
      const initialState = {
        objects: { 1: { id: 1 } },
        constraints: { 1: { id: 1 } },
        loading: true,
        error: 'Test error',
        simulationInProgress: true
      };

      expect(physicsReducer(initialState, resetPhysics())).toEqual({
        objects: {},
        constraints: {},
        loading: false,
        error: null,
        simulationInProgress: false
      });
    });
  });

  describe('async thunks', () => {
    describe('createPhysicsObject', () => {
      it('should handle pending state', () => {
        const action = { type: createPhysicsObject.pending.type };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle fulfilled state', () => {
        const mockObject = { id: 1, name: 'Test Object' };
        const action = {
          type: createPhysicsObject.fulfilled.type,
          payload: mockObject
        };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(false);
        expect(state.objects[1]).toEqual(mockObject);
      });

      it('should handle rejected state', () => {
        const action = {
          type: createPhysicsObject.rejected.type,
          error: { message: 'Failed to create object' }
        };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to create object');
      });
    });

    describe('updatePhysicsObject', () => {
      it('should handle pending state', () => {
        const action = { type: updatePhysicsObject.pending.type };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle fulfilled state', () => {
        const mockObject = { id: 1, name: 'Updated Object' };
        const action = {
          type: updatePhysicsObject.fulfilled.type,
          payload: mockObject
        };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(false);
        expect(state.objects[1]).toEqual(mockObject);
      });

      it('should handle rejected state', () => {
        const action = {
          type: updatePhysicsObject.rejected.type,
          error: { message: 'Failed to update object' }
        };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to update object');
      });
    });

    describe('deletePhysicsObject', () => {
      it('should handle pending state', () => {
        const action = { type: deletePhysicsObject.pending.type };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle fulfilled state', () => {
        const initialState = {
          objects: { 1: { id: 1 } },
          constraints: {},
          loading: true,
          error: null,
          simulationInProgress: false
        };
        const action = {
          type: deletePhysicsObject.fulfilled.type,
          payload: 1
        };
        const state = physicsReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.objects[1]).toBeUndefined();
      });

      it('should handle rejected state', () => {
        const action = {
          type: deletePhysicsObject.rejected.type,
          error: { message: 'Failed to delete object' }
        };
        const state = physicsReducer(undefined, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to delete object');
      });
    });

    describe('simulateScene', () => {
      it('should handle pending state', () => {
        const action = { type: simulateScene.pending.type };
        const state = physicsReducer(undefined, action);
        expect(state.simulationInProgress).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should handle fulfilled state', () => {
        const mockObjects = [
          { id: 1, position: { x: 100, y: 100 } },
          { id: 2, position: { x: 200, y: 200 } }
        ];
        const action = {
          type: simulateScene.fulfilled.type,
          payload: mockObjects
        };
        const state = physicsReducer(undefined, action);
        expect(state.simulationInProgress).toBe(false);
        expect(state.objects[1]).toEqual(mockObjects[0]);
        expect(state.objects[2]).toEqual(mockObjects[1]);
      });

      it('should handle rejected state', () => {
        const action = {
          type: simulateScene.rejected.type,
          error: { message: 'Failed to simulate scene' }
        };
        const state = physicsReducer(undefined, action);
        expect(state.simulationInProgress).toBe(false);
        expect(state.error).toBe('Failed to simulate scene');
      });
    });
  });

  describe('selectors', () => {
    const state = {
      physics: {
        objects: { 1: { id: 1 } },
        constraints: { 1: { id: 1 } },
        loading: true,
        error: 'Test error',
        simulationInProgress: true
      }
    };

    it('should select physics objects', () => {
      expect(selectPhysicsObjects(state)).toEqual({ 1: { id: 1 } });
    });

    it('should select physics constraints', () => {
      expect(selectPhysicsConstraints(state)).toEqual({ 1: { id: 1 } });
    });

    it('should select loading state', () => {
      expect(selectPhysicsLoading(state)).toBe(true);
    });

    it('should select error state', () => {
      expect(selectPhysicsError(state)).toBe('Test error');
    });

    it('should select simulation progress state', () => {
      expect(selectSimulationInProgress(state)).toBe(true);
    });
  });
});
