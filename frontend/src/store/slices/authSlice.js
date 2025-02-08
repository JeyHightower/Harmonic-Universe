import api from '@/services/api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

export const login = createAsyncThunk('auth/login', async credentials => {
  const response = await api.post('/api/auth/login', credentials);
  const { access_token, refresh_token, user } = response.data;
  localStorage.setItem('token', access_token);
  localStorage.setItem('refreshToken', refresh_token);
  return { token: access_token, user };
});

export const demoLogin = createAsyncThunk('auth/demoLogin', async () => {
  const demoCredentials = {
    email: 'demo@example.com',
    password: 'password',
  };
  const response = await api.post('/api/auth/login', demoCredentials);
  const { access_token, refresh_token, user } = response.data;
  localStorage.setItem('token', access_token);
  localStorage.setItem('refreshToken', refresh_token);
  return { token: access_token, user };
});

export const register = createAsyncThunk('auth/register', async data => {
  const response = await api.post('/api/auth/register', data);
  const { access_token, refresh_token, user } = response.data;
  localStorage.setItem('token', access_token);
  localStorage.setItem('refreshToken', refresh_token);
  return { token: access_token, user };
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/api/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
});

export const fetchUser = createAsyncThunk('auth/fetchUser', async () => {
  const response = await api.get('/api/auth/user');
  return response.data;
});

export const updateUser = createAsyncThunk('auth/updateUser', async data => {
  const response = await api.patch('/api/auth/user', data);
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(logout.fulfilled, state => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(demoLogin.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Demo login failed';
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export const selectUser = state => state.auth.user;
export const selectToken = state => state.auth.token;
export const selectAuthLoading = state => state.auth.loading;
export const selectAuthError = state => state.auth.error;
export const selectIsAuthenticated = state => state.auth.isAuthenticated;

export default authSlice.reducer;
