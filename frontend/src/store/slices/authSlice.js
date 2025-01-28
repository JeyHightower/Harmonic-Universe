import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  showAuthModal: false,
  authModalView: 'login',
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { user, access_token, refresh_token } = response.data;

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);

      return { user, access_token, refresh_token };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { user, access_token, refresh_token } = response.data;

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);

      return { user, access_token, refresh_token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Registration failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refresh_token = localStorage.getItem('refreshToken');
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        '/api/auth/refresh',
        {},
        {
          headers: { Authorization: `Bearer ${refresh_token}` },
        }
      );

      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);

      return { access_token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Token refresh failed'
      );
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Password reset request failed'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/auth/reset-password/${token}`, {
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Password reset failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openAuthModal: (state, action) => {
      state.showAuthModal = true;
      state.authModalView = action.payload || 'login';
      state.error = null;
    },
    closeAuthModal: state => {
      state.showAuthModal = false;
      state.error = null;
    },
    setAuthModalView: (state, action) => {
      state.authModalView = action.payload;
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.showAuthModal = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(register.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.showAuthModal = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logout.pending, state => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, state => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access_token;
      })
      .addCase(refreshToken.rejected, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // Password Reset Request
    builder
      .addCase(requestPasswordReset.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Password Reset
    builder
      .addCase(resetPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        state.isLoading = false;
        state.showAuthModal = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { openAuthModal, closeAuthModal, setAuthModalView, clearError } =
  authSlice.actions;

export default authSlice.reducer;
