import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { log, AUTH_CONFIG, FORCE_DEMO_MODE, IS_PRODUCTION, ROUTES, isHardRefresh } from "../../utils";
import apiClient from "../../services/api"; // Ensure this import is correct

console.log("API Client Structure:", JSON.stringify(apiClient, null, 2)); // Log the entire API client structure

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

// Demo login functionality
export const demoLogin = createAsyncThunk(
  "auth/demoLogin",
  async (_, { dispatch }) => {
    try {
      console.log("Starting demo login process");
      
      // Create a demo user
      const demoUser = createDemoUser();
      
      // Create demo tokens
      const token = `demo-${demoUser.id}-${Date.now()}`;
      const refreshToken = `demo-refresh-${demoUser.id}-${Date.now()}`;
      
      // Store in localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));
      
      // Update state
      dispatch(loginSuccess({ user: demoUser, token }));
      
      return { user: demoUser, token };
    } catch (error) {
      console.error("Demo login failed:", error);
      dispatch(loginFailure(error.message));
      throw error;
    }
  }
);

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

      // Log refresh token availability for debugging
      if (refreshToken) {
        console.debug("Found refresh token, can use for token renewal if needed");
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
        if (response.data && response.data.user) {
          userData = response.data.user;
          // Update localStorage with fresh data
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
        }
      } catch (err) {
        console.warn("Token validation failed, using stored user data:", err);
        // Handle demo tokens
        if (token.startsWith('demo-')) {
          console.log("Demo token detected, creating fresh demo session");
          const userId = userData?.id || `demo-${Date.now()}`;
          userData = createDemoUser();
          const newToken = `demo-${userId}-${Date.now()}`;
          const newRefreshToken = `demo-refresh-${userId}-${Date.now()}`;
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, newToken);
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, newRefreshToken);
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
        } else if (!userData) {
          console.error("No valid user data available after token validation failure");
          return null;
        }
      }

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
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const isDemoToken = token && token.startsWith('demo-');

      if (isDemoToken) {
        console.log("Logging out demo user - cleaning up demo session");
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        dispatch(logoutSuccess());
        return null;
      }

      console.log("Normal logout - clearing auth data");
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      dispatch(logoutSuccess());
      return null;
    } catch (error) {
      console.error("Error during logout:", error);
      dispatch(logoutFailure(error.message));
      return null;
    }
  }
);

// Initialize the auth state
const initialState = (() => {
  try {
    let demoModeHelper = null;

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

    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;

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
      state.isLoading = false;
      state.error = null;
      state.authError = false;
      state.user = action.payload.user || action.payload;
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
      state.user = null;
      state.isLoading = false;
      state.error = null;
      state.authError = false;
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
          state.error = "Authentication check failed";
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
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(demoLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
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
} = authSlice.actions;

export default authSlice.reducer;
