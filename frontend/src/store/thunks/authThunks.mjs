import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.adapter';
import { authService } from '../../services/auth.service.mjs';
import { demoService } from '../../services/demo.service.mjs';
import { AUTH_CONFIG } from '../../utils/config.mjs';
import { handleError } from '../../utils/error';
import {
  loginFailure,
  loginStart,
  loginSuccess,
  logout,
  updateUser,
} from '../actions/authActions.mjs';

// Function to cleanup all authentication state when logging out
const cleanupAuthState = () => {
  // Remove the token
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);

  // Remove user data
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);

  // Remove refresh token
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

  // Remove any error flags
  localStorage.removeItem('token_verification_failed');
};

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      const response = await authService.login(credentials);
      dispatch(loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(loginFailure(handleError(error)));
      return rejectWithValue(handleError(error));
    }
  }
);

// Register
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      const response = await authService.register(userData);
      dispatch(loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(loginFailure(handleError(error)));
      return rejectWithValue(handleError(error));
    }
  }
);

// Demo login
export const demoLogin = createAsyncThunk(
  'auth/demoLogin',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.log('Thunk - Starting demo login process');

      // Check for a valid demo session before POSTing
      if (demoService.isValidDemoSession()) {
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const refresh_token = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        if (user && token) {
          dispatch(
            loginSuccess({
              user,
              token,
              refresh_token,
            })
          );
          window.dispatchEvent(new CustomEvent('storage'));
          return { success: true, user, token, refresh_token };
        }
      }

      try {
        const response = await demoService.login();
        console.log('Thunk - Demo login successful:', response);

        if (!response?.success || !response?.token || !response?.user) {
          throw new Error('Invalid response from demo login');
        }

        // Update Redux state
        dispatch(
          loginSuccess({
            user: response.user,
            token: response.token,
            refresh_token: response.refresh_token,
          })
        );

        // Dispatch a storage event to notify other components
        window.dispatchEvent(new CustomEvent('storage'));

        return response;
      } catch (error) {
        console.error('Thunk - Demo login failed:', error);
        dispatch(loginFailure(handleError(error)));
        return rejectWithValue(handleError(error));
      }
    } catch (error) {
      console.error('Thunk - Demo login process failed:', error);
      dispatch(loginFailure(handleError(error)));
      return rejectWithValue(handleError(error));
    }
  }
);

// Register a new user
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug('Registering user:', userData);

      const response = await api.auth.register(userData);
      console.debug('Registration successful:', response);

      // Store tokens
      if (response.data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
      } else if (response.data.access_token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.access_token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, response.data.refresh_token);
      }
      if (response.data.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
      }

      // Dispatch login success with user data
      dispatch(loginSuccess(response.data.user || {}));

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      const errorData = handleError(error);
      dispatch(loginFailure(errorData.message));
      return rejectWithValue(errorData);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      console.debug('Updating user profile:', profileData);
      const response = await api.user.updateProfile(profileData);
      console.debug('User profile updated:', response);

      // Update the user in the Redux store
      dispatch(updateUser(response));

      return response;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug('Logging in user:', loginData);

      const response = await api.auth.login(loginData);
      console.debug('Login successful:', response);

      // Store tokens
      if (response.data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
      } else if (response.data.access_token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.access_token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, response.data.refresh_token);
      }
      if (response.data.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
      }

      // Dispatch login success with user data
      dispatch(loginSuccess(response.data.user || {}));

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      const errorData = handleError(error);
      dispatch(loginFailure(errorData.message));
      return rejectWithValue(errorData);
    }
  }
);

// Check auth state
export const checkAuthState = createAsyncThunk('auth/checkAuthState', async (_, { dispatch }) => {
  try {
    // Check if this is a demo session
    if (demoService.isDemoSession()) {
      const response = await demoService.login();
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.token,
          refresh_token: response.refresh_token,
        })
      );
      return response;
    }

    // Regular auth check
    const response = await authService.validateToken();
    if (response.success) {
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.token,
        })
      );
      return response;
    }

    dispatch(logout());
    return null;
  } catch (error) {
    console.error('Auth state check failed:', error);
    dispatch(logout());
    return null;
  }
});

// Logout thunk
export const logoutThunk = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    // Clean up demo session if needed
    if (demoService.isDemoSession()) {
      demoService.cleanup();
    }

    // Regular logout
    await authService.logout();
    dispatch(logout());
  } catch (error) {
    console.error('Logout failed:', error);
    // Still dispatch logout even if API call fails
    dispatch(logout());
  }
});

export const loginWithToken = createAsyncThunk(
  'auth/loginWithToken',
  async (loginData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());

      const response = await api.auth.login(loginData);
      // ... existing code ...
    } catch (error) {
      // ... existing code ...
    }
  }
);

// Validate token
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

      if (!token) {
        return rejectWithValue('No token found');
      }

      // Handle demo tokens locally by checking if it's a demo token using demoService
      const isDemoToken = demoService.isDemoSession();
      if (isDemoToken) {
        console.log('Demo token detected, considering valid without server validation');
        return { valid: true };
      }

      // Check if token is valid locally first
      if (!authService.isTokenValid(token)) {
        console.warn('Token failed local validation');
        localStorage.setItem('token_verification_failed', 'true');
        authService.clearAuthData();
        return rejectWithValue('Token failed local validation');
      }

      // For non-demo tokens, validate with the server
      const response = await api.auth.validateToken();

      if (!response.data?.valid) {
        localStorage.setItem('token_verification_failed', 'true');
        authService.clearAuthData();
        return rejectWithValue('Token validation failed');
      }

      // Clear token verification failed flag if validation succeeds
      localStorage.removeItem('token_verification_failed');
      return response.data || { valid: response.success || false };
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.setItem('token_verification_failed', 'true');
      authService.clearAuthData();
      return rejectWithValue(handleError(error));
    }
  }
);

// Refresh token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.debug('Refreshing token');

      // Check if this is a demo session
      const isDemoSession = demoService.isDemoSession();
      if (isDemoSession) {
        console.log('Demo session detected, regenerating demo tokens');
        const demoData = await demoService.setupDemoSession();
        // Store both tokens
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, demoData.token);
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, demoData.refresh_token);
        return { token: demoData.token, refresh_token: demoData.refresh_token };
      }

      // Get refresh token from storage
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      // If no refresh token is available, return early
      if (!refreshToken) {
        console.error('No refresh token available');
        return rejectWithValue('No refresh token available');
      }

      // Validate token format before attempting to use
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid refresh token format - not a valid JWT token');
        // Clear the invalid token
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        return rejectWithValue('Invalid refresh token format');
      }

      const response = await api.auth.refreshToken();
      console.debug('Token refresh response:', response);

      if (response.success === false) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const newToken = response.data?.token || response.token || response.access_token;
      const newRefreshToken = response.data?.refresh_token || response.refresh_token;

      if (newToken) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, newToken);

        // Update refresh token if provided
        if (newRefreshToken) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Clear any token verification failure flags
        localStorage.removeItem('token_verification_failed');

        return { token: newToken };
      } else {
        throw new Error('No token in refresh response');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Validate and refresh token (used to ensure valid authentication before sensitive operations)
export const validateAndRefreshToken = createAsyncThunk(
  'auth/validateAndRefreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.debug('Validating and refreshing token if needed');

      // Get the current token
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshTokenValue = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      console.log('Debug - validateAndRefreshToken:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshTokenValue,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      });

      if (!token) {
        console.log('Debug - validateAndRefreshToken: No token found');
        return rejectWithValue('No authentication token found');
      }

      // For demo tokens, regenerate a fresh token
      const isDemoSession = demoService.isDemoSession();
      console.log('Debug - validateAndRefreshToken: isDemoSession =', isDemoSession);

      if (isDemoSession) {
        console.log('Demo session detected in validateAndRefreshToken, regenerating demo tokens');
        try {
          const demoData = await demoService.setupDemoSession();
          // Ensure both tokens are stored
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, demoData.token);
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, demoData.refresh_token);
          return { valid: true, token: demoData.token };
        } catch (demoError) {
          console.error('Error setting up demo session:', demoError);
          return rejectWithValue({
            message: 'Failed to set up demo session',
            status: 500,
            authError: true,
          });
        }
      }

      // Check if token is valid locally first
      if (!authService.isTokenValid(token)) {
        console.warn('Token failed local validation');
        localStorage.setItem('token_verification_failed', 'true');
        authService.clearAuthData();
        return rejectWithValue('Token failed local validation');
      }

      // For real tokens, force a refresh regardless of expiration
      try {
        console.log('Debug - validateAndRefreshToken: Attempting to refresh real token');
        // Force token refresh
        const response = await api.auth.refreshToken();

        if (!response.success && !response.token && !response.data?.token) {
          throw new Error('Token refresh failed');
        }

        // Extract the new token
        const newToken = response.data?.token || response.token;
        const newRefreshToken = response.data?.refresh_token || response.refresh_token;

        if (newToken) {
          // Update token in localStorage
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, newToken);

          // Update refresh token if provided
          if (newRefreshToken) {
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);
          }

          // Update authorization header
          if (api.defaults && api.defaults.headers) {
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          }

          // Clear token verification failed flag
          localStorage.removeItem('token_verification_failed');

          return { valid: true, token: newToken };
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        localStorage.setItem('token_verification_failed', 'true');
        authService.clearAuthData();
        return rejectWithValue(
          'Authentication error: ' + (refreshError.message || 'Token refresh failed')
        );
      }

      // If we got here without a new token, validation failed
      localStorage.setItem('token_verification_failed', 'true');
      authService.clearAuthData();
      return rejectWithValue('Authentication validation failed');
    } catch (error) {
      console.error('validateAndRefreshToken error:', error);
      localStorage.setItem('token_verification_failed', 'true');
      authService.clearAuthData();
      return rejectWithValue(handleError(error));
    }
  }
);
