import { describe, expect, it } from 'vitest';
import authReducer, {
  clearError,
  login,
  logout,
  register,
  resetPassword,
} from '../../../src/store/slices/authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const state = {
        ...initialState,
        error: 'Some error',
      };
      expect(authReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle logout', () => {
      const state = {
        user: { id: 1 },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      const action = { type: logout.fulfilled.type };
      expect(authReducer(state, action)).toEqual(initialState);
    });
  });

  describe('async thunks', () => {
    describe('login', () => {
      it('should set loading state', () => {
        const action = { type: login.pending.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should set success state', () => {
        const user = { id: 1, username: 'test' };
        const token = 'test-token';
        const action = {
          type: login.fulfilled.type,
          payload: { user, token },
        };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(user);
        expect(state.token).toEqual(token);
        expect(state.error).toBe(null);
      });

      it('should set error state', () => {
        const error = 'Invalid credentials';
        const action = {
          type: login.rejected.type,
          payload: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(error);
      });
    });

    describe('register', () => {
      it('should set loading state', () => {
        const action = { type: register.pending.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should set success state', () => {
        const user = { id: 1, username: 'test' };
        const token = 'test-token';
        const action = {
          type: register.fulfilled.type,
          payload: { user, token },
        };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(user);
        expect(state.token).toEqual(token);
        expect(state.error).toBe(null);
      });

      it('should set error state', () => {
        const error = 'Registration failed';
        const action = {
          type: register.rejected.type,
          payload: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(error);
      });
    });

    describe('resetPassword', () => {
      it('should set loading state', () => {
        const action = { type: resetPassword.pending.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBe(null);
      });

      it('should set success state', () => {
        const action = { type: resetPassword.fulfilled.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
      });

      it('should set error state', () => {
        const error = 'Password reset failed';
        const action = {
          type: resetPassword.rejected.type,
          payload: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(error);
      });
    });
  });
});
