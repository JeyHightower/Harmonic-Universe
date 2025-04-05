import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/api.js";
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

      const response = await apiClient.login(credentials);
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

      const response = await apiClient.register(userData);
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

      try {
        // Try using the API first
        console.log("Thunk - Calling demo login API endpoint");
        const response = await apiClient.demoLogin();
        console.log("Thunk - Demo login API response:", response);

        // Handle different response structures
        let userData, token, refreshToken;

        if (response.data) {
          // Extract user data
          userData = response.data.user || response.data;

          // Extract tokens
          token = response.data.token || response.data.access_token;
          refreshToken = response.data.refresh_token;

          console.log("Thunk - Extracted data from response:", {
            hasUserData: !!userData,
            hasToken: !!token,
            tokenLength: token ? token.length : 0
          });
        } else {
          console.error("Thunk - Unexpected response format:", response);
          throw new Error("Invalid response format from server");
        }

        // Store authentication data
        if (token) {
          console.log("Thunk - Storing token in localStorage");
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        } else {
          console.error("Thunk - No token in response");
          throw new Error("No token received from server");
        }

        if (refreshToken) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }

        if (userData) {
          console.log("Thunk - Storing user data in localStorage");
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
        } else {
          console.error("Thunk - No user data in response");
          throw new Error("No user data received from server");
        }

        // Create auth data object for Redux store
        const authData = {
          user: userData,
          token,
          refresh_token: refreshToken
        };

        console.log("Thunk - Dispatching loginSuccess with:", {
          userId: userData?.id,
          hasToken: !!token
        });

        // Update Redux state
        dispatch(loginSuccess(authData));

        // Dispatch a storage event to notify other components
        window.dispatchEvent(new Event("storage"));

        console.log("Thunk - Demo login successful");
        return authData;
      } catch (apiError) {
        console.error("Thunk - API demo login failed:", apiError);

        // We won't use the fallback for demo login anymore since we have a working endpoint
        throw apiError;
      }
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

      const response = await apiClient.register(userData);
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
      const response = await apiClient.updateUserProfile(profileData);
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

      const response = await apiClient.login(loginData);
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
      const response = await apiClient.logout();
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
