import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { demoService } from '../../services/demo.service.mjs';
import { AUTH_CONFIG, log } from '../../utils';
import { AUTH_ACTION_TYPES } from '../actions/authActions.mjs';
import { checkAuthState, demoLogin, login, logoutThunk, register } from '../thunks/authThunks.mjs';

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
      localStorage.setItem('token_verification_failed', 'true');
      dispatch(loginFailure(error.message));
      return null;
    }
  }
);

// Initialize the auth state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  tokenVerificationFailed: false,
  loginRedirect: '/',
  offlineMode: false,
  loginInProgress: false,
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
      state.tokenVerificationFailed = false;
      state.loginInProgress = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token || action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.error = null;
      state.tokenVerificationFailed = false;
      state.loginInProgress = false;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
      state.tokenVerificationFailed = true;
      state.loginInProgress = false;
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
      state.loginInProgress = false;
    },
    logoutSuccess: (state) => {
      console.debug('Logout success');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    logoutFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
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
    setLoginRedirect: (state, action) => {
      state.loginRedirect = action.payload;
    },
    setTokenVerificationFailed: (state, action) => {
      state.tokenVerificationFailed = action.payload;
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
      .addCase(handleAuthTokens.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token || action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.error = null;
        state.tokenVerificationFailed = false;
      })
      .addCase(handleAuthTokens.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
        state.tokenVerificationFailed = true;
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
  setTokenVerificationFailed,
} = authSlice.actions;

// Additional action exports for compatibility
export const registerSuccess = loginSuccess;
export const registerFailure = loginFailure;
export const validateTokenStart = loginStart;
export const validateTokenSuccess = loginSuccess;
export const validateTokenFailure = loginFailure;

export default authSlice.reducer;
