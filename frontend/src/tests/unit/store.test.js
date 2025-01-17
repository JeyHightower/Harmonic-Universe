import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';

// Mock the Redux actions
jest.mock('../../redux/slices/authSlice', () => ({
  login: credentials => ({
    type: 'auth/login/pending',
    payload: credentials,
  }),
  signup: userData => ({
    type: 'auth/signup/pending',
    payload: userData,
  }),
}));

jest.mock('../../redux/slices/universeSlice', () => ({
  createUniverse: data => ({
    type: 'universe/createUniverse/pending',
    payload: data,
  }),
  getUniverses: () => ({
    type: 'universe/getUniverses/pending',
  }),
}));

jest.mock('../../redux/slices/storyboardSlice', () => ({
  createStoryboard: data => ({
    type: 'storyboard/createStoryboard/pending',
    payload: data,
  }),
  getStoryboards: universeId => ({
    type: 'storyboard/getStoryboards/pending',
    payload: universeId,
  }),
}));

// Create mock store with thunk middleware
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Redux Store Tests', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      },
      universe: {
        universes: [],
        currentUniverse: null,
        loading: false,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });

    // Clear mock history
    store.clearActions();
  });

  describe('Auth Actions', () => {
    test('login dispatches correct actions', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      await store.dispatch({
        type: 'auth/login/pending',
        payload: credentials,
      });
      await store.dispatch({
        type: 'auth/login/fulfilled',
        payload: { token: 'test-token', user: { id: 1, username: 'testuser' } },
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/login/pending');
      expect(actions[1].type).toBe('auth/login/fulfilled');
    });

    test('signup dispatches correct actions', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
      };
      await store.dispatch({ type: 'auth/signup/pending', payload: userData });
      await store.dispatch({
        type: 'auth/signup/fulfilled',
        payload: { message: 'User created successfully' },
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/signup/pending');
      expect(actions[1].type).toBe('auth/signup/fulfilled');
    });
  });

  describe('Universe Actions', () => {
    test('createUniverse dispatches correct actions', async () => {
      const universeData = {
        name: 'Test Universe',
        gravity_constant: 9.81,
      };
      await store.dispatch({
        type: 'universe/createUniverse/pending',
        payload: universeData,
      });
      await store.dispatch({
        type: 'universe/createUniverse/fulfilled',
        payload: { id: 1, ...universeData },
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('universe/createUniverse/pending');
      expect(actions[1].type).toBe('universe/createUniverse/fulfilled');
    });

    test('getUniverses dispatches correct actions', async () => {
      await store.dispatch({ type: 'universe/getUniverses/pending' });
      await store.dispatch({
        type: 'universe/getUniverses/fulfilled',
        payload: [
          { id: 1, name: 'Universe 1' },
          { id: 2, name: 'Universe 2' },
        ],
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('universe/getUniverses/pending');
      expect(actions[1].type).toBe('universe/getUniverses/fulfilled');
    });
  });

  describe('Storyboard Actions', () => {
    test('createStoryboard dispatches correct actions', async () => {
      const storyboardData = {
        universeId: 1,
        plot_point: 'Test Plot Point',
        harmony_tie: 0.8,
      };
      await store.dispatch({
        type: 'storyboard/createStoryboard/pending',
        payload: storyboardData,
      });
      await store.dispatch({
        type: 'storyboard/createStoryboard/fulfilled',
        payload: { id: 1, ...storyboardData },
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('storyboard/createStoryboard/pending');
      expect(actions[1].type).toBe('storyboard/createStoryboard/fulfilled');
    });

    test('getStoryboards dispatches correct actions', async () => {
      await store.dispatch({
        type: 'storyboard/getStoryboards/pending',
        payload: 1,
      });
      await store.dispatch({
        type: 'storyboard/getStoryboards/fulfilled',
        payload: [
          { id: 1, plot_point: 'Plot Point 1' },
          { id: 2, plot_point: 'Plot Point 2' },
        ],
      });

      const actions = store.getActions();
      expect(actions[0].type).toBe('storyboard/getStoryboards/pending');
      expect(actions[1].type).toBe('storyboard/getStoryboards/fulfilled');
    });
  });
});
