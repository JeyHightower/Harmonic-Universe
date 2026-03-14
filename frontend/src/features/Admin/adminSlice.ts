import { createSlice } from "@reduxjs/toolkit"
import type { AdminState } from "../../types/user"
import { getAllUsers } from "./adminActions"


const initialState:AdminState = {
    allUsers:[],
    isLoading: false,
    error: null
}


const AdminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers:{},
    extraReducers: (builder) =>{
        builder
        .addCase(getAllUsers.pending, (state) => {
            state.isLoading = true;
            state.error = null
        })
        .addCase(getAllUsers.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.allUsers = action.payload
        })
        .addCase(getAllUsers.rejected, (state, action) => {
            if (action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
    }
})



export default AdminSlice.reducer;
export { getAllUsers};