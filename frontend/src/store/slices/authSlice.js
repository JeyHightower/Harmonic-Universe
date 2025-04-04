import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";
import { log } from "../../utils/logger";
import { AUTH_CONFIG } from "../../utils/config";
import { ROUTES } from "../../utils/routes";
import apiClient from "../../services/api";
import { login, register } from "../thunks/authThunks";

// Debug logging for all authentication operations
const logAuthOperation = (operation, data = {}) => {
  try {
    console.log(`Auth operation: ${operation}`, data);
    log("auth", `Auth operation: ${operation}`, data);
  } catch (error) {
    console.error("Error logging auth operation", error);
  }
};

// Debug logging for authentication errors
const logAuthError = (operation, error) => {
  try {
    console.error(`Auth error in ${operation}:`, error);
    log("auth", `Auth error in ${operation}`, { error: error.message });
  } catch (logError) {
    console.error("Error logging auth error", logError);
  }
};

// Handle auth tokens
export const handleAuthTokens = createAsyncThunk(
  "auth/handleTokens",
  async (tokens, { dispatch }) => {
    try {
      console.debug("Handling auth tokens:", tokens);

      // Store tokens in localStorage
      if (tokens.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.token);
      } else if (tokens.access_token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.access_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
      if (tokens.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(tokens.user));
      }

      // Update state
      dispatch(loginSuccess(tokens));
      return tokens;
    } catch (error) {
      console.error("Error handling auth tokens:", error);
      dispatch(loginFailure(error.message));
      return null;
    }
  }
);

// Check auth state
export const checkAuthState = createAsyncThunk(
  "auth/checkState",
  async (_, { dispatch }) => {
    try {
      console.debug("Checking auth state");

      // Get tokens from localStorage
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

      if (!token) {
        console.debug("No token found in localStorage");
        dispatch(logout());
        return null;
      }

      // Try to validate token
      try {
        console.debug("Attempting to validate token");
        const response = await apiClient.validateToken();
        console.debug("Token validation successful:", response);

        // Update state with validated user
        if (response.data.user) {
          dispatch(loginSuccess({ user: response.data.user, token }));
          return response.data;
        }
      } catch (error) {
        console.warn("Token validation failed:", error);
        console.error("Validation error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });

        // Try to refresh token
        if (refreshToken) {
          try {
            console.debug("Attempting to refresh token");
            const response = await apiClient.refreshToken();
            console.debug("Token refresh successful:", response);

            // Store new tokens
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

            // Update state with refreshed user
            dispatch(loginSuccess({ user: response.data.user, token: response.data.token || response.data.access_token }));
            return response.data;
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // If refresh fails, clear all auth data and logout
            localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
            localStorage.removeItem(AUTH_CONFIG.USER_KEY);
            dispatch(logout());
            return null;
          }
        } else {
          // No refresh token available, clear auth data and logout
          localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
          localStorage.removeItem(AUTH_CONFIG.USER_KEY);
          dispatch(logout());
          return null;
        }
      }

      // If we got here without valid user data, try using localStorage as fallback
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.debug("Using cached user data from localStorage:", userData);
          dispatch(loginSuccess({ user: userData, token }));
          return { user: userData };
        } catch (e) {
          console.error("Failed to parse stored user data", e);
        }
      }

      // If all else fails, logout
      console.warn("No valid user data found, logging out");
      dispatch(logout());
      return null;
    } catch (error) {
      console.error("Auth state check failed:", error);
      dispatch(logout());
      return null;
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      console.debug("Logging out user");

      // Clear tokens from localStorage
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);

      // Update state
      dispatch(logoutSuccess());
      return null;
    } catch (error) {
      console.error("Error during logout:", error);
      dispatch(logoutFailure(error.message));
      return null;
    }
  }
);

// Get available API endpoints based on current environment
const getDemoEndpoints = () => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  const isProduction = !hostname.includes("localhost");

  // Base endpoints that are always available
  const endpoints = [
    "/api/auth/demo-login",
    "/api/v1/auth/demo-login",
    "/api/auth/login",
    "/api/v1/auth/login",
  ];

  // Add production-specific endpoints if needed
  if (isProduction) {
    const apiHostname = hostname.replace("www.", "").includes("render.com")
      ? "harmonic-universe-api.onrender.com"
      : `api.${hostname}`;

    // Add absolute URLs to API server
    endpoints.push(
      `https://${apiHostname}/api/auth/demo-login`,
      `https://${apiHostname}/api/v1/auth/demo-login`,
      `https://${apiHostname}/api/auth/login`,
      `https://harmonic-universe-api.onrender.com/api/auth/demo-login`,
      `https://harmonic-universe-api.onrender.com/api/v1/auth/demo-login`,
      `https://harmonic-universe-api.onrender.com/api/auth/login`
    );

    // Also add same-origin API endpoints
    endpoints.push(
      `${origin}/api/auth/demo-login`,
      `${origin}/api/v1/auth/demo-login`,
      `${origin}/api/auth/login`
    );
  } else {
    // Add local development endpoints
    endpoints.push(
      "http://localhost:8000/api/auth/demo-login",
      "http://localhost:5001/api/auth/demo-login"
    );
  }

  return endpoints;
};

// Demo login thunk
export const demoLogin = createAsyncThunk(
  "auth/demoLogin",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      logAuthOperation("Demo login attempt");

      const response = await apiClient.demoLogin();
      logAuthOperation("Demo login successful", { status: response.status });

      // Extract user data from response
      const userData = response.data.user || response.data;
      const token = response.data.token || response.data.access_token;
      const refreshToken = response.data.refresh_token;

      // Store tokens and user data
      if (token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      }
      if (refreshToken) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
      }
      if (userData) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
      }

      // Update state with the correct data structure
      dispatch(loginSuccess({ user: userData, token, refresh_token: refreshToken }));

      return { user: userData, token, refresh_token: refreshToken };
    } catch (error) {
      logAuthError("Demo login", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to demo login"
      );
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  networkError: null,
  offlineMode: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      console.debug("Login success:", action.payload);

      // Start with a clean state to avoid stale data
      state.isLoading = false;
      state.error = null;
      state.authError = false;

      // Extract user data from response based on different API response formats
      if (action.payload?.user) {
        state.user = action.payload.user;
      } else if (action.payload?.name || action.payload?.email || action.payload?.id) {
        state.user = action.payload;
      } else if (typeof action.payload === 'object') {
        // If payload is an object but doesn't have explicit user property
        // try to use the whole payload as user data
        state.user = action.payload;
      }

      // Ensure we have user data
      if (!state.user) {
        console.warn("Login success but no user data found in payload:", action.payload);
      }

      state.isAuthenticated = true;
    },
    loginFailure: (state, action) => {
      console.debug("Login failure:", action.payload);
      state.isLoading = false;
      state.error = action.payload?.message || action.payload || "Login failed";
      state.authError = true;
      state.isAuthenticated = false;
    },
    logoutSuccess: (state) => {
      console.debug("Logout success");

      // Clean up the entire state on logout
      state.user = null;
      state.isLoading = false;
      state.error = null;
      state.authError = false;
      state.isAuthenticated = false;

      // Force clear any cached tokens
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
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
  },
  extraReducers: (builder) => {
    builder
      // Check Auth State
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isAuthenticated = false; // Reset auth state while checking
        logAuthOperation("check-auth-state-pending");
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.error = null;
          logAuthOperation("check-auth-state-fulfilled", {
            userId: action.payload.id,
          });
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.error = "Authentication check failed";
          logAuthOperation("check-auth-state-fulfilled-no-user");
        }
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        logAuthOperation("check-auth-state-rejected", { error: state.error });
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        logAuthOperation("login-pending");
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        // Properly extract user data based on API response format
        const payload = action.payload || {};
        state.user = payload.user || payload;

        state.isAuthenticated = true;
        state.error = null;
        logAuthOperation("login-fulfilled", {
          userId: state.user?.id,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        logAuthOperation("login-rejected", { error: state.error });
      })

      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        logAuthOperation("register-pending");
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        logAuthOperation("register-fulfilled", {
          userId: action.payload?.id,
        });
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        logAuthOperation("register-rejected", { error: state.error });
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        logAuthOperation("logout-pending");
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        logAuthOperation("logout-fulfilled");
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        logAuthOperation("logout-rejected", { error: state.error });
      })

      // Demo Login
      .addCase(demoLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        logAuthOperation("demo-login-pending");
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.isLoading = false;

        // Properly extract user data based on API response format
        const payload = action.payload || {};
        state.user = payload.user || payload;

        state.isAuthenticated = true;
        state.error = null;
        logAuthOperation("demo-login-fulfilled", {
          userId: state.user?.id,
        });
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        logAuthOperation("demo-login-rejected", { error: state.error });
      });
  },
});

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
} = authSlice.actions;

export default authSlice.reducer;
