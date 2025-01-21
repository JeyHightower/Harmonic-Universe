import authReducer, {
  clearError,
  login,
  logout,
  register,
  resetPassword,
  setCredentials,
} from '../../../src/redux/slices/authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    status: 'idle',
    error: null,
  };

  describe('reducer', () => {
    it('should handle initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setCredentials', () => {
      const user = { id: 1, username: 'test' };
      const token = 'test-token';
      const actual = authReducer(initialState, setCredentials({ user, token }));
      expect(actual.user).toEqual(user);
      expect(actual.token).toEqual(token);
      expect(actual.status).toEqual('succeeded');
    });

    it('should handle clearError', () => {
      const state = {
        ...initialState,
        error: 'test error',
      };
      const actual = authReducer(state, clearError());
      expect(actual.error).toBeNull();
    });

    it('should handle logout', () => {
      const state = {
        user: { id: 1 },
        token: 'token',
        status: 'succeeded',
        error: null,
      };
      const actual = authReducer(state, logout());
      expect(actual).toEqual(initialState);
    });
  });

  describe('async thunks', () => {
    describe('login', () => {
      it('should set pending state', () => {
        const action = { type: login.pending.type };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('loading');
      });

      it('should set fulfilled state', () => {
        const user = { id: 1, username: 'test' };
        const token = 'test-token';
        const action = {
          type: login.fulfilled.type,
          payload: { user, token },
        };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('succeeded');
        expect(state.user).toEqual(user);
        expect(state.token).toEqual(token);
      });

      it('should set rejected state', () => {
        const error = 'Invalid credentials';
        const action = {
          type: login.rejected.type,
          error: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('failed');
        expect(state.error).toEqual(error);
      });
    });

    describe('register', () => {
      it('should set pending state', () => {
        const action = { type: register.pending.type };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('loading');
      });

      it('should set fulfilled state', () => {
        const user = { id: 1, username: 'test' };
        const token = 'test-token';
        const action = {
          type: register.fulfilled.type,
          payload: { user, token },
        };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('succeeded');
        expect(state.user).toEqual(user);
        expect(state.token).toEqual(token);
      });

      it('should set rejected state', () => {
        const error = 'Email already exists';
        const action = {
          type: register.rejected.type,
          error: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('failed');
        expect(state.error).toEqual(error);
      });
    });

    describe('resetPassword', () => {
      it('should set pending state', () => {
        const action = { type: resetPassword.pending.type };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('loading');
      });

      it('should set fulfilled state', () => {
        const action = { type: resetPassword.fulfilled.type };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('succeeded');
      });

      it('should set rejected state', () => {
        const error = 'Invalid token';
        const action = {
          type: resetPassword.rejected.type,
          error: { message: error },
        };
        const state = authReducer(initialState, action);
        expect(state.status).toEqual('failed');
        expect(state.error).toEqual(error);
      });
    });
  });
});
