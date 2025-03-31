import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { client } from "../../services/client";
import { endpoints } from "../../services/endpoints";
import { log } from "../../utils/logger";
import { apiClient } from "../../services/api";
import { AUTH_CONFIG } from "../../utils/config";
import { ROUTES } from "../../utils/routes";
import { useNavigate } from "react-router-dom";

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

// Async thunks
export const checkAuthState = createAsyncThunk(
  "auth/checkAuthState",
  async (_, { rejectWithValue }) => {
    try {
      logAuthOperation("Check auth state");

      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (!token) {
        throw new Error("No token found");
      }

      const response = await apiClient.checkAuth();
      logAuthOperation("Auth state check successful", {
        status: response.status,
      });

      return response.data.user;
    } catch (error) {
      logAuthError("Check auth state", error);
      return rejectWithValue(error.message || "Failed to check auth state");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      logAuthOperation("Login attempt", { email: credentials.email });

      const response = await client.post(endpoints.auth.login, credentials);
      logAuthOperation("Login successful", { status: response.status });

      // Store tokens
      handleAuthTokens(response.data);

      return response.data.user;
    } catch (error) {
      logAuthError("Login", error);

      return rejectWithValue(
        error.response?.data?.message || "Failed to login"
      );
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      logAuthOperation("Signup attempt", { email: userData.email });

      const response = await client.post(endpoints.auth.signup, userData);
      logAuthOperation("Signup successful", { status: response.status });

      // Store tokens
      handleAuthTokens(response.data);

      return response.data.user;
    } catch (error) {
      logAuthError("Signup", error);

      return rejectWithValue(
        error.response?.data?.message || "Failed to sign up"
      );
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
  async (_, { rejectWithValue }) => {
    try {
      logAuthOperation("Demo login attempt");

      const response = await apiClient.demoLogin();
      logAuthOperation("Demo login successful", { status: response.status });

      // Store tokens
      handleAuthTokens(response.data);

      return response.data;
    } catch (error) {
      logAuthError("Demo login", error);
      return rejectWithValue(error.message || "Failed to login");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      logAuthOperation("logout-attempt");

      // Get token before making request
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (!token) {
        logAuthOperation("logout-no-token");
        // Still clear storage and navigate
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem("demoLoginResponse");
        window.location.href = "/";
        return null;
      }

      // Call backend logout endpoint
      const response = await apiClient.logout();
      logAuthOperation("logout-success", { status: response.status });

      // Clear local storage tokens after successful API call
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      // Also clear session cache
      sessionStorage.removeItem("demoLoginResponse");

      // Navigate to home page
      window.location.href = "/";

      return null;
    } catch (error) {
      logAuthError("logout", error);

      // Still clear tokens even if API call fails
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      // Still navigate to home even if logout fails
      window.location.href = "/";

      return rejectWithValue(error.message || "Failed to logout");
    }
  }
);

// Helper function to handle auth tokens
const handleAuthTokens = (data) => {
  logAuthOperation("handle-auth-tokens", {
    dataKeys: Object.keys(data),
    hasToken: !!data.token,
    hasAccessToken: !!data.access_token,
  });

  // Handle different token formats
  if (data.token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
    logAuthOperation("token-stored", { source: "token" });
  } else if (data.access_token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
    logAuthOperation("token-stored", { source: "access_token" });
  } else if (data.tokens?.access_token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.tokens.access_token);
    logAuthOperation("token-stored", { source: "tokens.access_token" });
  }

  // Handle refresh tokens
  if (data.refresh_token) {
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
    logAuthOperation("refresh-token-stored", { source: "refresh_token" });
  } else if (data.tokens?.refresh_token) {
    localStorage.setItem(
      AUTH_CONFIG.REFRESH_TOKEN_KEY,
      data.tokens.refresh_token
    );
    logAuthOperation("refresh-token-stored", {
      source: "tokens.refresh_token",
    });
  }

  // Update debug state
  if (window.authDebug) {
    window.authDebug.tokens = {
      hasAccessToken: !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
      hasRefreshToken: !!localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY),
    };
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  networkError: false,
  offlineMode: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      logAuthOperation("logout-user");
    },
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
      logAuthOperation("login-start");
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      logAuthOperation("login-success", {
        userId: action.payload?.user?.id,
      });
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Login failed";
      logAuthOperation("login-failure", { error: state.error });
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      logAuthOperation("update-user", {
        userId: action.payload?.id,
      });
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
        logAuthOperation("check-auth-state-pending");
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        logAuthOperation("check-auth-state-fulfilled", {
          userId: action.payload?.id,
        });
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
        state.loading = true;
        state.error = null;
        logAuthOperation("login-pending");
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        logAuthOperation("login-fulfilled", {
          userId: action.payload?.id,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
        logAuthOperation("login-rejected", { error: state.error });
      })

      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
        logAuthOperation("signup-pending");
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        logAuthOperation("signup-fulfilled", {
          userId: action.payload?.id,
        });
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Sign up failed";
        logAuthOperation("signup-rejected", { error: state.error });
      })

      // Demo Login
      .addCase(demoLogin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
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
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        logAuthOperation("logout-fulfilled");
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        logAuthOperation("logout-rejected", { error: state.error });
      });
  },
});

export const {
  logoutUser,
  loginStart,
  loginSuccess,
  loginFailure,
  updateUser,
  setNetworkError,
  setOfflineMode,
} = authSlice.actions;
export default authSlice.reducer;
