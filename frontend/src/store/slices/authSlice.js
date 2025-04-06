import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";
import { log } from "../../utils/logger";
import { AUTH_CONFIG, FORCE_DEMO_MODE, IS_PRODUCTION } from "../../utils/config";
import { ROUTES } from "../../utils/routes";
import apiClient from "../../services/api";
import { login, register } from "../thunks/authThunks";
import { isHardRefresh } from "../../utils/browserUtils";

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

// Helper to create a demo user when needed
const createDemoUser = () => {
  const randomId = 'demo-' + Math.random().toString(36).substring(2, 10);
  return {
    id: randomId,
    username: 'demo_user',
    email: 'demo@harmonic-universe.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper to set up demo mode authentication
const setupDemoMode = () => {
  console.log("Setting up demo mode authentication");
  const mockUser = createDemoUser();
  const mockToken = 'demo-token-' + Math.random().toString(36).substring(2, 15);

  // Store the mock tokens and user data
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(mockUser));
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, 'demo-refresh-' + Math.random().toString(36).substring(2, 15));

  return { user: mockUser, token: mockToken };
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
  async (_, { dispatch, getState }) => {
    try {
      console.debug("Checking auth state");

      // Check if already authenticated in Redux state
      const { auth } = getState();
      if (auth.isAuthenticated && auth.user) {
        console.log("Already authenticated in Redux state");
        return auth.user;
      }

      // Get tokens from localStorage
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

      if (!token) {
        console.debug("No token found in localStorage");
        dispatch(logout());
        return null;
      }

      let userData = null;

      // Try to parse stored user data first
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
          console.debug("Found user data in localStorage:", userData.id || userData.user?.id);
        } catch (err) {
          console.error("Failed to parse stored user data:", err);
        }
      }

      // Try to validate token
      try {
        console.debug("Attempting to validate token");
        const response = await apiClient.validateToken();
        console.debug("Token validation successful:", response);

        // Update state with validated user
        if (response.data.user) {
          userData = response.data.user;
          // Update localStorage with fresh data
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
        }
      } catch (err) {
        console.warn("Token validation failed, using stored user data:", err);
        // If validation fails but we have stored user data, use that
        if (!userData) {
          console.error("No valid user data available after token validation failure");
          return null;
        }
      }

      // If we have user data from any source, use it
      if (userData) {
        dispatch(loginSuccess({ user: userData, token }));
        return userData;
      }

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

      // For hard refreshes, don't clear local storage
      if (isHardRefresh()) {
        console.log("Hard refresh detected - not clearing auth data");
        return null;
      }

      // For normal logout, clear tokens from localStorage
      console.log("Normal logout - clearing auth data");
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

// Initialize the auth state
const initialState = (() => {
  try {
    // Force demo mode in production if configured
    if (FORCE_DEMO_MODE && IS_PRODUCTION) {
      console.log("Forcing demo mode in production");
      const demoData = setupDemoMode();
      return {
        user: demoData.user,
        token: demoData.token,
        isAuthenticated: true,
        status: "idle",
        error: null,
        isLoading: false,
        loginRedirect: ROUTES.HOME,
      };
    }

    // Check if we have a token in localStorage
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;

    // In production, if token is demo-token, set up demo mode
    if (IS_PRODUCTION && token && token.startsWith('demo-')) {
      console.log("Demo token detected in production, setting up demo mode");
      const demoData = setupDemoMode();
      return {
        user: demoData.user,
        token: demoData.token,
        isAuthenticated: true,
        status: "idle",
        error: null,
        isLoading: false,
        loginRedirect: ROUTES.HOME,
      };
    }

    // Normal initialization
    return {
      user: user,
      token: token || null,
      isAuthenticated: !!token && !!user,
      status: "idle",
      error: null,
      isLoading: false,
      loginRedirect: ROUTES.HOME,
    };
  } catch (error) {
    console.error("Error initializing auth state:", error);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      status: "idle",
      error: null,
      isLoading: false,
      loginRedirect: ROUTES.HOME,
    };
  }
})();

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
