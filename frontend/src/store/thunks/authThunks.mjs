import { createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../services/api.adapter';
import { AUTH_CONFIG } from "../../utils/config.mjs";
import {
  loginFailure,
  loginStart,
  loginSuccess,
  logoutSuccess,
  updateUser,
  registerSuccess,
  registerFailure,
  validateTokenStart,
  validateTokenSuccess,
  validateTokenFailure,
} from "../slices/authSlice.mjs";
import { demoUserService } from "../../services/demo-user.service.mjs";

const handleError = (error) => {
  console.error("API Error:", error);
  // Format error to ensure we don't return a complex object that could be accidentally rendered
  const errorMessage = error.response?.data?.message || error.message || "An error occurred";
  return {
    message: errorMessage,
    status: error.response?.status || 500,
    // Only include essential data, not the full response which might be complex
    data: typeof error.response?.data === 'string' ? error.response?.data : 
          (error.response?.data?.error || errorMessage)
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
  localStorage.removeItem("token_verification_failed");
};

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      console.debug("Logging in user:", credentials.email);

      // Clean up any previous failed auth state
      localStorage.removeItem("token_verification_failed");

      const response = await api.auth.login(credentials);

      if (!response.success) {
        throw new Error(response.message || "Login failed");
      }

      // Store the token in localStorage - use the same key as in config
      if (response.data?.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
      }

      // Store user data if available
      if (response.data?.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
      }

      // Prepare data for state update
      const authData = {
        user: response.data.user,
        token: response.data.token,
        refresh_token: response.data.refresh_token
      };

      dispatch(loginSuccess(authData));
      return authData;
    } catch (error) {
      console.error("Login failed:", error);

      // Regular error handling
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

      const response = await api.auth.register(userData);
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
      // Convert to a simple string message for rejectWithValue
      const errorData = handleError(error);
      return rejectWithValue(errorData.message || "Registration failed");
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

      // Create a proper JWT-like token with three parts
      const header = btoa(JSON.stringify({ alg: 'demo', typ: 'JWT' }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({
        sub: demoUser.id,
        name: demoUser.firstName + ' ' + demoUser.lastName,
        iat: now,
        exp: now + 3600, // 1 hour from now
      }));
      const signature = btoa('demo-signature');
      
      // Create token with header.payload.signature format
      const mockToken = `${header}.${payload}.${signature}`;
      const mockRefreshToken = `${header}.${btoa(JSON.stringify({
        sub: demoUser.id,
        exp: now + 86400, // 24 hours from now
      }))}.${signature}`;

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

      const response = await api.auth.register(userData);
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
      const response = await api.user.updateProfile(profileData);
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

      const response = await api.auth.login(loginData);
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

// Logout thunk with rate limiting protection
let lastLogoutThunkAttempt = 0;
const LOGOUT_THUNK_COOLDOWN = 2000; // 2 seconds between allowed attempts

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const now = Date.now();

      // Prevent rapid multiple logout attempts
      if (now - lastLogoutThunkAttempt < LOGOUT_THUNK_COOLDOWN) {
        console.log("Throttled logout thunk - too many requests");
        // Just clean up local state without API call
        cleanupAuthState();
        return {
          message: "Logged out successfully (local only)",
          throttled: true
        };
      }

      // Update timestamp
      lastLogoutThunkAttempt = now;

      // Try to call the logout API endpoint first
      try {
        await api.auth.logout();
        console.log("Logout API call successful");
      } catch (apiError) {
        // Check for rate limiting or other expected errors
        if (apiError.response?.status === 429) {
          console.warn("Logout rate limited (429) - proceeding with local cleanup only");
        } else {
          console.error("Logout API call failed:", apiError);
        }
        // Continue with local logout even if API call fails
      }

      // Clean up all auth state regardless of API result
      cleanupAuthState();

      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout thunk encountered an error:", error);

      // Still clean up local state even on error
      cleanupAuthState();

      return rejectWithValue({
        message: error.message || "Logout failed, but local state was cleared",
        status: error.response?.status || 500,
      });
    }
  }
);

export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
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
  "auth/validateToken",
  async (_, { rejectWithValue }) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      
      if (!token) {
        return rejectWithValue("No token found");
      }
      
      // Handle demo tokens locally by checking if it's a demo token using demoUserService
      const isDemoToken = demoUserService.isDemoSession();
      if (isDemoToken) {
        console.log("Demo token detected, considering valid without server validation");
        return { valid: true };
      }
      
      // For non-demo tokens, validate with the server
      const response = await api.auth.validateToken();
      return response.data || { valid: response.success || false };
    } catch (error) {
      console.error("Token validation failed:", error);
      return rejectWithValue(handleError(error));
    }
  }
);
