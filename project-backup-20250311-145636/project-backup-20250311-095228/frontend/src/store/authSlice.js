import { createSlice } from '@reduxjs/toolkit';
import { AUTH_CONFIG } from '../utils/config.js';

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
  console.debug('Initializing auth state');
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const user = localStorage.getItem(AUTH_CONFIG.USER_KEY);

  // If we have no token, we know we're not authenticated
  if (!token) {
    console.debug('No token found during initialization');
    return {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      networkError: false,
      offlineMode: false
    };
  }

  // If we have a valid token, we're authenticated
  if (isTokenValid(token)) {
    console.debug('Valid token found during initialization');
    return {
      isAuthenticated: true,
      user: user ? JSON.parse(user) : null,
      loading: false,
      error: null,
      networkError: false,
      offlineMode: false
    };
  }

  // If token is invalid, clear it and return unauthenticated state
  console.debug('Invalid token found during initialization');
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  return {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    networkError: false,
    offlineMode: false
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    loginStart: state => {
      state.loading = true;
      state.error = null;
      state.networkError = false;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.networkError = false;
      // If we successfully logged in with fallback, set offlineMode to true
      state.offlineMode = action.payload.offlineMode || false;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = action.payload;

      // Check if the error is a network error
      if (action.payload?.isNetworkError) {
        state.networkError = true;
      }

      // Clear tokens on login failure
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    },
    logout: state => {
      // Clear tokens
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);

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
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

      if (!token) {
        console.debug('No token found during check');
        state.isAuthenticated = false;
        state.loading = false;
        return;
      }

      if (isTokenValid(token)) {
        console.debug('Valid token found during check');
        state.isAuthenticated = true;
        state.loading = false;
        return;
      }

      console.debug('Invalid token found during check');
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    },
    setNetworkError: (state, action) => {
      state.networkError = action.payload;
    },
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
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
  setNetworkError,
  setOfflineMode
} = authSlice.actions;

export default authSlice.reducer;
