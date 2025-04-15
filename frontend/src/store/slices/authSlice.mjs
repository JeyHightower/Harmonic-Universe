import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { log, AUTH_CONFIG, FORCE_DEMO_MODE, IS_PRODUCTION, ROUTES, isHardRefresh } from "../../utils";
import { login, register } from "../thunks/authThunks"; // Import login and register thunks
import { authService } from "../../services/auth.service.mjs"; // Import the auth service directly
import { demoUserService } from "../../services/demo-user.service.mjs"; // Import demo user service

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

// Helper to setup demo mode when needed
const setupDemoMode = () => {
  console.debug("Setting up demo mode");
  const demoUser = createDemoUser();
  const token = `demo-token-${Date.now()}`;
  const refreshToken = `demo-refresh-${Date.now()}`;
  
  // Store in localStorage
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));
  
  return { user: demoUser, token };
};

// Demo login functionality
export const demoLogin = createAsyncThunk(
  "auth/demoLogin",
  async (_, { dispatch }) => {
    try {
      console.log("Starting demo login process");
      
      // Use the demo service to handle demo login
      const demoResponse = await demoUserService.performDemoLogin();
      
      if (!demoResponse.success) {
        throw new Error(demoResponse.error || "Demo login failed");
      }
      
      // Update state with demo user and token
      dispatch(loginSuccess(demoResponse.data));
      
      return demoResponse.data;
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

      // Store token in localStorage
      if (tokens.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.token);
      } else if (tokens.access_token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, tokens.access_token);
      }
      
      // Store user in localStorage if provided
      if (tokens.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(tokens.user));
      }

      // Clear any token verification failure flag
      localStorage.removeItem("token_verification_failed");

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
      
      // Check if auth state is already loaded
      const { auth } = getState();
      if (auth.isAuthenticated && auth.user) {
        console.debug("Already authenticated with user:", auth.user.email);
        return auth.user;
      }
      
      // Get token and user data from localStorage
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      let userData = null;
      
      try {
        const userString = localStorage.getItem(AUTH_CONFIG.USER_KEY);
        if (userString) {
          userData = JSON.parse(userString);
        }
      } catch (err) {
        console.error("Error parsing user data from localStorage:", err);
      }
      
      // If no token, handle as not authenticated
      if (!token) {
        console.debug("No token found, not authenticated");
        dispatch(logout());
        return null;
      }
      
      console.debug("Found token and userData:", { 
        hasToken: !!token, 
        hasUserData: !!userData,
        tokenLength: token?.length || 0,
        isDemoToken: token?.includes('demo')
      });
      
      // Check if token verification previously failed
      const tokenVerificationFailed = localStorage.getItem("token_verification_failed");
      if (tokenVerificationFailed === "true") {
        console.warn("Token verification previously failed, logging out");
        dispatch(logout());
        return null;
      }
      
      // Demo mode handling
      const isDemoToken = token.includes('demo');
      
      if (isDemoToken && userData) {
        console.log("Demo token detected, handling demo session");
        // For demo tokens, don't try to validate with the server 
        // Just ensure we have valid demo data
        userData = userData || createDemoUser();
        
        // Update localStorage with fresh demo token if needed
        if (!token.startsWith('demo-')) {
          const newToken = `demo-token-${Date.now()}`;
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, newToken);
        }
        
        dispatch(loginSuccess({ user: userData, token }));
        return userData;
      }

      // Only try to validate non-demo tokens
      try {
        console.debug("Attempting to validate token");
        const isValid = await authService.validateToken();
        console.debug("Token validation result:", isValid);

        if (isValid) {
          if (userData) {
            // Update localStorage with fresh data if needed
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
            dispatch(loginSuccess({ user: userData, token }));
            return userData;
          }
        } else {
          // Token invalid - remove auth data
          console.warn("Token validation failed, handling as unauthenticated");
          dispatch(logout());
          return null;
        }
      } catch (err) {
        console.warn("Token validation failed:", err);
        dispatch(logout());
        return null;
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
        // Use centralized auth data cleanup
        authService.clearAuthData();
        dispatch(logoutSuccess());
        return null;
      }

      console.log("Normal logout - clearing auth data");
      // Use centralized auth data cleanup
      authService.clearAuthData();
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
    if (FORCE_DEMO_MODE && IS_PRODUCTION) {
      console.log("Forcing demo mode in production");
      const demoData = demoUserService.setupDemoSession();
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
      const demoData = demoUserService.setupDemoSession();
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
