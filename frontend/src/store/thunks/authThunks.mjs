import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.adapter';
import { authService } from '../../services/auth.service.mjs';
import { demoUserService } from '../../services/demo-user.service.mjs';
import { AUTH_CONFIG } from '../../utils/config.mjs';
import {
  loginFailure,
  loginStart,
  loginSuccess,
  logoutFailure,
  logoutSuccess,
  updateUser,
} from '../slices/authSlice.mjs';

const handleError = (error) => {
  console.error('API Error:', error);
  // Format error to ensure we don't return a complex object that could be accidentally rendered
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
  return {
    message: errorMessage,
    status: error.response?.status || 500,
    // Only include essential data, not the full response which might be complex
    data:
      typeof error.response?.data === 'string'
        ? error.response?.data
        : error.response?.data?.error || errorMessage,
  };
};

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
export const demoLoginThunk = createAsyncThunk('auth/demoLogin', async (_, { dispatch }) => {
  try {
    console.log('Starting demo login process');

    // Use the demo user service to set up the demo session
    const demoData = await demoUserService.setupDemoSession();

    // Update auth state with demo data
    dispatch(
      loginSuccess({
        user: demoData.user,
        token: demoData.token,
      })
    );

    return demoData;
  } catch (error) {
    console.error('Demo login failed:', error);
    throw error;
  }
});

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

// Logout
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch, rejectWithValue }) => {
  try {
    console.log('Thunk - Starting logout process');

    // Check if this is a demo session
    if (demoUserService.isDemoSession()) {
      console.log('Thunk - Logging out demo user');
      demoUserService.clearDemoSession();
    } else {
      console.log('Thunk - Logging out regular user');
      await authService.logout();
    }

    dispatch(logoutSuccess());
    return null;
  } catch (error) {
    console.error('Thunk - Logout failed:', error);
    dispatch(logoutFailure(handleError(error)));
    return rejectWithValue(handleError(error));
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

      // Handle demo tokens locally by checking if it's a demo token using demoUserService
      const isDemoToken = demoUserService.isDemoSession();
      if (isDemoToken) {
        console.log('Demo token detected, considering valid without server validation');
        return { valid: true };
      }

      // For non-demo tokens, validate with the server
      const response = await api.auth.validateToken();
      return response.data || { valid: response.success || false };
    } catch (error) {
      console.error('Token validation failed:', error);
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

      // Import needed services
      const { authService } = await import(/* @vite-ignore */ '../../services/auth.service.mjs');
      const { demoUserService } = await import(
        /* @vite-ignore */ '../../services/demo-user.service.mjs'
      );

      // Check if this is a demo session
      const isDemoSession = demoUserService.isDemoSession();
      if (isDemoSession) {
        console.log('Demo session detected, regenerating demo tokens');
        const demoData = demoUserService.setupDemoSession();
        return { token: demoData.token };
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
      const isDemoSession = demoUserService.isDemoSession();
      console.log('Debug - validateAndRefreshToken: isDemoSession =', isDemoSession);

      if (isDemoSession) {
        console.log('Demo session detected in validateAndRefreshToken, regenerating demo tokens');
        const demoData = await demoUserService.setupDemoSession();
        return { valid: true, token: demoData.token };
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

          return { valid: true, token: newToken };
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return rejectWithValue(
          'Authentication error: ' + (refreshError.message || 'Token refresh failed')
        );
      }

      // If we got here without a new token, validation failed
      return rejectWithValue('Authentication validation failed');
    } catch (error) {
      console.error('validateAndRefreshToken error:', error);
      return rejectWithValue(handleError(error));
    }
  }
);
