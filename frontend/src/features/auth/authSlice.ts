import { createSlice } from '@reduxjs/toolkit';
import { getInitialToken, getInitialUser, handleAuthSuccess } from '../../helpers';
import type { AuthState } from '../../types/auth';
import { loginUser, registerUser, registerAdmin} from './authActions';
;

const initialState: AuthState = {
    user: getInitialUser(),
    token: getInitialToken(),
    isAuthenticated: !!getInitialToken(),
    isLoading: false,
    error: null,
};


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logoutUser:(state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, handleAuthSuccess)
        .addCase(loginUser.rejected, (state, action)=>{
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.isAuthenticated = false;
            state.error = action.payload as string;
        })
        .addCase(registerUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, handleAuthSuccess)
        .addCase(registerUser.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.isAuthenticated = false;
            state.error = action.payload as string;
        })
        .addCase(registerAdmin.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(registerAdmin.fulfilled, handleAuthSuccess)
        .addCase(registerAdmin.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.isAuthenticated= false;
            state.error = action.payload as string;
        })
    }
})

export const { logoutUser } = authSlice.actions;
export {registerUser, loginUser,registerAdmin}
export default authSlice.reducer;