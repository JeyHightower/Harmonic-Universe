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
  console.debug('Initializing auth state');
  const token = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  // If we have no tokens, we know we're not authenticated
  if (!token && !refreshToken) {
    console.debug('No tokens found during initialization');
    return {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    };
  }

  // If we have a valid token, we're authenticated
  if (token && isTokenValid(token)) {
    console.debug('Valid access token found during initialization');
    return {
      isAuthenticated: true,
      user: null,
      loading: false,
      error: null,
    };
  }

  // If we have a valid refresh token, we're authenticated
  if (refreshToken && isTokenValid(refreshToken)) {
    console.debug('Valid refresh token found during initialization');
    return {
      isAuthenticated: true,
      user: null,
      loading: false,
      error: null,
    };
  }

  // If we have tokens but they're invalid, we're not authenticated
  console.debug('Invalid tokens found during initialization');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  return {
    isAuthenticated: false,
    user: null,
    loading: false,
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
        console.debug('No tokens found during check');
        state.isAuthenticated = false;
        state.loading = false;
        return;
      }

      if (isTokenValid(token)) {
        console.debug('Valid access token found during check');
        state.isAuthenticated = true;
        state.loading = false;
        return;
      }

      if (refreshToken && isTokenValid(refreshToken)) {
        console.debug('Valid refresh token found during check');
        state.isAuthenticated = true;
        state.loading = false;
        return;
      }

      console.debug('Invalid tokens found during check');
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
