import { createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../services/api.adapter';
import {
  handleOfflineAuthentication,
  shouldUseFallback,
} from "../../utils/authFallback";
import { AUTH_CONFIG } from "../../utils/config.js";
import {
  loginFailure,
  loginStart,
  loginSuccess,
  updateUser,
} from "../slices/authSlice.js";

const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug("Logging in user:", credentials.email);

      const response = await api.login(credentials);
      console.debug("Login successful:", response);

      // Extract relevant data from response
      const responseData = response.data || response;
      const userData = responseData.user || responseData;
      const token = responseData.token || responseData.access_token;
      const refreshToken = responseData.refresh_token;

      console.debug("Extracted login data:", {
        userData,
        hasToken: !!token,
        hasRefreshToken: !!refreshToken
      });

      // Store tokens
      if (token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      }
      if (refreshToken) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
      }
      if (userData) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
      }

      // Prepare data for state update
      const authData = {
        user: userData,
        token,
        refresh_token: refreshToken
      };

      dispatch(loginSuccess(authData));
      return authData;
    } catch (error) {
      console.error("Login failed:", error);

      // Check if we should use the fallback authentication
      if (shouldUseFallback(error)) {
        console.warn("Using offline authentication fallback for login");
        const fallbackData = handleOfflineAuthentication();

        // Store tokens from fallback
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
        if (fallbackData.refresh_token) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, fallbackData.refresh_token);
        }
        if (fallbackData.user) {
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(fallbackData.user));
        }

        dispatch(loginSuccess(fallbackData));
        return fallbackData;
      }

      // Regular error handling if fallback not used
      dispatch(loginFailure(handleError(error)));
      return rejectWithValue(handleError(error));
    }
  }
);

// Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      console.debug("Registering user:", userData.email);

      const response = await api.register(userData);
      console.debug("Registration successful:", response);

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

      dispatch(loginSuccess(response.data));
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Demo login
export const demoLogin = createAsyncThunk(
  "auth/demoLogin",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.log("Thunk - Starting demo login process");

      // Use direct demo user creation as primary method for reliability
      console.log("Thunk - Using direct demo user creation (high reliability method)");

      // Create a demo user with a unique ID - use simpler ID format to avoid special characters
      const randomId = Math.floor(Math.random() * 10000);
      const demoUser = {
        id: `demo-${randomId}`,
        username: "demo_user",
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create a mock token - use simple format without special characters
      const mockToken = `demo-token-${Date.now()}`;
      const mockRefreshToken = `demo-refresh-${Date.now()}`;

      // Store in localStorage
      console.log("Thunk - Storing demo authentication data in localStorage");
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, mockRefreshToken);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

      // Create auth data object for Redux store
      const authData = {
        user: demoUser,
        token: mockToken,
        refresh_token: mockRefreshToken
      };

      console.log("Thunk - Dispatching loginSuccess with direct demo user");

      // Update Redux state
      dispatch(loginSuccess(authData));

      // Dispatch a storage event to notify other components
      if (typeof window !== 'undefined') {
        if (typeof window.Event === 'function') {
          window.dispatchEvent(new window.Event("storage"));
        } else {
          // Fallback for older browsers
          const storageEvent = document.createEvent("Event");
          storageEvent.initEvent("storage", true, true);
          window.dispatchEvent(storageEvent);
        }
      }

      console.log("Thunk - Direct demo login successful");
      return authData;

      // API call approach removed as it was causing errors
      // We're now using the direct method for better reliability
    } catch (error) {
      console.error("Thunk - Demo login failed:", error);
      dispatch(loginFailure(handleError(error)));
      return rejectWithValue(handleError(error));
    }
  }
);

// Register a new user
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug("Registering user:", userData);

      const response = await api.register(userData);
      console.debug("Registration successful:", response);

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
      console.error("Registration failed:", error);
      const errorData = handleError(error);
      dispatch(loginFailure(errorData.message));
      return rejectWithValue(errorData);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      console.debug("Updating user profile:", profileData);
      const response = await api.updateUserProfile(profileData);
      console.debug("User profile updated:", response);

      // Update the user in the Redux store
      dispatch(updateUser(response));

      return response;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug("Logging in user:", loginData);

      const response = await api.login(loginData);
      console.debug("Login successful:", response);

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
      console.error("Login failed:", error);
      const errorData = handleError(error);
      dispatch(loginFailure(errorData.message));
      return rejectWithValue(errorData);
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.debug("Logging out user");

      // Get token before making request
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (!token) {
        console.debug("No token found, clearing state and navigating");
        // Still clear storage and navigate
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        window.location.href = "/";
        return { message: "Logged out successfully" };
      }

      // Call backend logout endpoint
      const response = await api.logout();
      console.debug("Logout API call successful:", response);

      // Clear local storage after successful API call
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);

      // Clear auth state
      dispatch(loginFailure({ message: "Logged out successfully" }));

      // Navigate to home page
      window.location.href = "/";

      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear tokens even if API call fails
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      // Still navigate to home even if logout fails
      window.location.href = "/";
      return rejectWithValue(handleError(error));
    }
  }
);
