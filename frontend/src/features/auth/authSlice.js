import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';
import { endpoints } from '../../api/endpoints';

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post(endpoints.auth.login, credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post(endpoints.auth.register, userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const demoLogin = createAsyncThunk(
    'auth/demoLogin',
    async (_, { rejectWithValue }) => {
        try {
            // Try multiple endpoints until one works
            let response = null;
            let error = null;

            // Demo credentials
            const demoCredentials = {
                email: "demo@example.com",
                password: "demo123"
            };

            // Try endpoints in order
            const endpointOptions = [
                endpoints.auth.demoLogin,
                endpoints.auth.login,
                '/api/auth/demo-login',
                '/api/v1/auth/demo-login',
                'http://localhost:8000/api/auth/demo-login',
                'http://localhost:5001/api/auth/demo-login'
            ];

            // Try each endpoint until one works
            for (const endpoint of endpointOptions) {
                try {
                    console.log(`Trying demo login with endpoint: ${endpoint}`);
                    response = await api.post(endpoint, demoCredentials);

                    if (response.status === 200 || response.status === 201) {
                        console.log(`Demo login successful with endpoint: ${endpoint}`);
                        break; // Exit the loop if successful
                    }
                } catch (err) {
                    console.error(`Error with endpoint ${endpoint}:`, err);
                    error = err;
                }
            }

            // If no endpoint worked, throw the last error
            if (!response) {
                throw error || new Error('All demo login endpoints failed');
            }

            // Store tokens
            if (response.data.token) {
                localStorage.setItem('accessToken', response.data.token);
            }
            if (response.data.access_token) {
                localStorage.setItem('accessToken', response.data.access_token);
            }
            if (response.data.refresh_token) {
                localStorage.setItem('refreshToken', response.data.refresh_token);
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            // Remove tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            return { success: true };
        } catch (error) {
            return rejectWithValue({ message: error.message });
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Login failed';
            })

            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Registration failed';
            })

            // Demo Login
            .addCase(demoLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(demoLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(demoLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Demo login failed';
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            });
    }
});

export const { setUser, clearError } = authSlice.actions;

export default authSlice.reducer;
