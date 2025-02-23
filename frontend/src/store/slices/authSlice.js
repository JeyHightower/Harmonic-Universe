import { createSlice } from '@reduxjs/toolkit';

// Helper function to check if token is valid
const isTokenValid = token => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

// Helper to get initial auth state
const getInitialAuthState = () => {
  const token = localStorage.getItem('accessToken');
  return {
    isAuthenticated: Boolean(token && isTokenValid(token)),
    user: null,
    loading: true, // Start with loading true to check auth state
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    loginStart: state => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = action.payload;
      // Clear tokens on login failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    logout: state => {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Reset state
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    checkAuthState: state => {
      console.debug('Checking auth state...');
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token && !refreshToken) {
        console.debug('No tokens found');
        state.isAuthenticated = false;
        state.loading = false;
        return;
      }

      if (isTokenValid(token)) {
        console.debug('Access token is valid');
        state.isAuthenticated = true;
        state.loading = false;
        return;
      }

      if (refreshToken && isTokenValid(refreshToken)) {
        console.debug('Access token expired, but refresh token valid');
        state.isAuthenticated = true;
        state.loading = false;
        return;
      }

      console.debug('No valid tokens found');
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  setLoading,
  checkAuthState,
} = authSlice.actions;

export default authSlice.reducer;
