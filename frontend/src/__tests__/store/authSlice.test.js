import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  register,
} from '../../store/slices/authSlice';

describe('Auth Slice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      user: { id: 1, email: 'test@example.com' },
      access_token: 'mock-token',
    };

    it('should handle login.pending', () => {
      store.dispatch({ type: login.pending.type });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle login.fulfilled', () => {
      store.dispatch({ type: login.fulfilled.type, payload: mockResponse });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.token).toBe(mockResponse.access_token);
    });

    it('should handle login.rejected', () => {
      const error = 'Invalid credentials';
      store.dispatch({ type: login.rejected.type, payload: error });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error);
    });
  });

  describe('Register', () => {
    const mockUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      access_token: 'mock-token',
    };

    it('should handle register.pending', () => {
      store.dispatch({ type: register.pending.type });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle register.fulfilled', () => {
      store.dispatch({ type: register.fulfilled.type, payload: mockResponse });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.token).toBe(mockResponse.access_token);
    });

    it('should handle register.rejected', () => {
      const error = 'Email already exists';
      store.dispatch({ type: register.rejected.type, payload: error });
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error);
    });
  });

  describe('Logout', () => {
    it('should handle logout.fulfilled', () => {
      // Set initial authenticated state
      store.dispatch({
        type: login.fulfilled.type,
        payload: {
          user: { id: 1 },
          access_token: 'token',
        },
      });

      // Dispatch logout
      store.dispatch({ type: logout.fulfilled.type });
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
