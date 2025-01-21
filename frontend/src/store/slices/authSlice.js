import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Login thunk started with credentials:', credentials);
      const response = await authService.login(credentials);
      console.log('Login thunk successful:', response);
      return response;
    } catch (error) {
      console.error('Login thunk failed:', error);
      return rejectWithValue(error);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Register thunk started with data:', userData);
      const response = await authService.register(userData);
      console.log('Register thunk successful:', response);
      return response;
    } catch (error) {
      console.error('Register thunk failed:', error);
      return rejectWithValue(error);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  console.log('Logout thunk started');
  await authService.logout();
  console.log('Logout thunk successful');
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      console.log('Reset password thunk started for email:', email);
      const response = await authService.resetPassword(email);
      console.log('Reset password thunk successful:', response);
      return response;
    } catch (error) {
      console.error('Reset password thunk failed:', error);
      return rejectWithValue(error);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Refresh token thunk started');
      const response = await authService.refreshToken();
      console.log('Refresh token thunk successful:', response);
      return response;
    } catch (error) {
      console.error('Refresh token thunk failed:', error);
      return rejectWithValue(error);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(login.pending, state => {
        console.log('Login pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('Login fulfilled:', action.payload);
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        console.log('Login rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Register
      .addCase(register.pending, state => {
        console.log('Register pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        console.log('Register fulfilled:', action.payload);
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        console.log('Register rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Logout
      .addCase(logout.fulfilled, state => {
        console.log('Logout fulfilled');
        return initialState;
      })
      // Reset Password
      .addCase(resetPassword.pending, state => {
        console.log('Reset password pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        console.log('Reset password fulfilled');
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        console.log('Reset password rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload?.message || 'Password reset failed';
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        console.log('Refresh token fulfilled:', action.payload);
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        console.log('Refresh token rejected:', action.payload);
        return initialState;
      });
  },
});

export const { clearError, setError } = authSlice.actions;
export default authSlice.reducer;
