import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { demoService } from '../../services/demo.service.mjs';
import { AUTH_CONFIG, log } from '../../utils';
import { AUTH_ACTION_TYPES } from '../actions/authActions.mjs';
import { checkAuthState, demoLogin, login, logoutThunk, register } from '../thunks/authThunks';

// Debug logging for all authentication operations
const logAuthOperation = (operation, data = {}) => {
  try {
    console.log(`Auth operation: ${operation}`, data);
    log('auth', `Auth operation: ${operation}`, data);
  } catch (error) {
    console.error('Error logging auth operation', error);
  }
};

// Debug logging for authentication errors
const logAuthError = (operation, error) => {
  try {
    console.error(`Auth error in ${operation}:`, error);
    log('auth', `Auth error in ${operation}`, { error: error.message });
  } catch (logError) {
    console.error('Error logging auth error', logError);
  }
};

// Helper to create a demo user
const createDemoUser = () => ({
  id: 'demo-user',
  email: 'demo@example.com',
  username: 'Demo User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Helper to check if a token is a demo token
const isDemoToken = (token) => {
  if (!token) return false;

  try {
    // First check if it's a JWT
    const parts = token.split('.');
    if (parts.length === 3) {
      // Try to decode the payload
      const payload = JSON.parse(atob(parts[1]));
      return (
        payload.sub &&
        (payload.sub.includes('demo-') ||
          payload.sub.includes('demo_') ||
          payload.sub === 'demo-user')
      );
    }
  } catch (e) {
    // If JWT parsing fails, check for legacy demo tokens
    return (
      token.startsWith('demo-') || token.includes('demo_token_') || token.includes('demo-token-')
    );
  }
  return false;
};

// Helper to setup demo mode when needed
const setupDemoMode = async () => {
  console.debug('Setting up demo mode');
  const response = await demoService.login();
  return response;
};

// Handle auth tokens
export const handleAuthTokens = createAsyncThunk(
  'auth/handleTokens',
  async (tokens, { dispatch }) => {
    try {
      console.debug('Handling auth tokens:', tokens);

      // Store token in localStorage
      if (tokens.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.token);
      } else if (tokens.access_token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.access_token);
      }

      // Store refresh token in localStorage if provided
      if (tokens.refresh_token) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refresh_token);
      }

      // Store user in localStorage if provided
      if (tokens.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(tokens.user));
      }

      // Clear any token verification failure flag
      localStorage.removeItem('token_verification_failed');

      // Update state
      dispatch(loginSuccess(tokens));
      return tokens;
    } catch (error) {
      console.error('Error handling auth tokens:', error);
      dispatch(loginFailure(error.message));
      return null;
    }
  }
);

// Initialize the auth state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginRedirect: '/',
  offlineMode: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      console.debug('Logout success');
      state.user = null;
      state.isLoading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
    logoutFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setNetworkError: (state, action) => {
      state.networkError = action.payload;
    },
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
    },
    logout: (state) => {
      // Clean up demo session if needed
      if (demoService.isDemoSession()) {
        demoService.cleanup();
      }

      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
    },
    setLoginRedirect: (state, action) => {
      state.loginRedirect = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.error = null;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.error = 'Authentication check failed';
        }
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(demoLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.error.message;
      })
      .addMatcher(
        (action) => action.type === AUTH_ACTION_TYPES.TOKEN_REFRESHED,
        (state, action) => {
          state.isLoading = false;
          state.error = null;
          state.token = action.payload.token;
          if (action.payload.user) {
            state.user = action.payload.user;
          }
          state.isAuthenticated = true;
        }
      )
      .addMatcher(
        (action) => action.type === AUTH_ACTION_TYPES.AUTH_FAILURE,
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload || 'Authentication error';
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }
      );
  },
});

// Exporting necessary actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  logoutFailure,
  updateUser,
  clearError,
  setNetworkError,
  setOfflineMode,
  logout,
  setLoginRedirect,
} = authSlice.actions;

// Additional action exports for compatibility
export const registerSuccess = loginSuccess;
export const registerFailure = loginFailure;
export const validateTokenStart = loginStart;
export const validateTokenSuccess = loginSuccess;
export const validateTokenFailure = loginFailure;

export default authSlice.reducer;
