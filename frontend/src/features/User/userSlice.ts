import type { AuthState} from "../../types/auth";
import { getInitialToken, getInitialUser } from "../../helpers";
import { createSlice } from "@reduxjs/toolkit";
import { deleteUser, getProfile, updateProfile } from "./userActions";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { LoginResponse } from "../../types/auth";

const initialState:AuthState = {
    user: getInitialUser(),
    token: getInitialToken(),
    isAuthenticated: !! getInitialToken(),
    isLoading: true,
    error: null
}


 const userSlice = createSlice({
    name : 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(getProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(getProfile.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
            state.isLoading = false;
            state.user = action.payload.user;
            state.token = action.payload.token || state.token;
        })
        .addCase(getProfile.rejected, (state,action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
            return;
            }
            state.isLoading = false;
            state.user = null;
            state.token = null;
        })
        .addCase(updateProfile.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(updateProfile.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.user = action.payload;
        })
        .addCase(updateProfile.rejected, (state, action) => {
            if (action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(deleteUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(deleteUser.fulfilled, (state) => {
            state.isLoading = false;
            state.error = null;
            state.user = null;
        })
        .addCase(deleteUser.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })

    }
})


 
export default userSlice.reducer;
export { getProfile }; 