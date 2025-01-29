import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
    login,
    logout,
    register,
    selectAuth,
    selectIsAuthenticated,
    selectUser,
} from '../../store/slices/authSlice';
import { mockUser } from '../../utils/test-auth-helper';

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('selectors', () => {
    it('should select auth state', () => {
      const state = store.getState();
      expect(selectAuth(state)).toBe(state.auth);
    });

    it('should select user', () => {
      const state = store.getState();
      expect(selectUser(state)).toBe(state.auth.user);
    });

    it('should select isAuthenticated', () => {
      const state = store.getState();
      expect(selectIsAuthenticated(state)).toBe(state.auth.isAuthenticated);
    });
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBeFalsy();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle login.pending', () => {
      store.dispatch(login.pending('', { email: '', password: '' }));
      const state = store.getState().auth;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle login.fulfilled', () => {
      store.dispatch(
        login.fulfilled(
          { user: mockUser, token: 'test-token' },
          '',
          { email: '', password: '' }
        )
      );
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBeTruthy();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle login.rejected', () => {
      store.dispatch(
        login.rejected(new Error('Login failed'), '', { email: '', password: '' })
      );
      const state = store.getState().auth;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Login failed');
    });

    it('should handle register.pending', () => {
      store.dispatch(
        register.pending('', { email: '', password: '', username: '' })
      );
      const state = store.getState().auth;
      expect(state.isLoading).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle register.fulfilled', () => {
      store.dispatch(
        register.fulfilled(
          { user: mockUser, token: 'test-token' },
          '',
          { email: '', password: '', username: '' }
        )
      );
      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBeTruthy();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle register.rejected', () => {
      store.dispatch(
        register.rejected(
          new Error('Registration failed'),
          '',
          { email: '', password: '', username: '' }
        )
      );
      const state = store.getState().auth;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBe('Registration failed');
    });

    it('should handle logout', () => {
      // First login
      store.dispatch(
        login.fulfilled(
          { user: mockUser, token: 'test-token' },
          '',
          { email: '', password: '' }
        )
      );

      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBeFalsy();
      expect(state.error).toBeNull();
    });
  });
});
