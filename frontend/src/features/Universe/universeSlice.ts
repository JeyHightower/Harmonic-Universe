import { createSlice } from "@reduxjs/toolkit";
import { getCurrentUniverse } from "../../helpers";
import type { UniverseState } from "../../types/universe";
import { createUniverse, deleteUniverse, getAllUniverses, getUniverse, updateUniverse } from "./universeActions";


const initialState: UniverseState = {
    currentUniverse: getCurrentUniverse(),
    allUniverses: [], 
    isLoading: false,
    error: null
}

const universeSlice = createSlice({
    name: 'universe',
    initialState,
    reducers:{
        setCurrentUniverse: (state,action) => {
            state.currentUniverse = action.payload;
            localStorage.setItem('activeUniverse', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createUniverse.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createUniverse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error= null;
                state.currentUniverse = action.payload;
                state.allUniverses.push(action.payload);
            })
            .addCase(createUniverse.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(getAllUniverses.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllUniverses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.allUniverses = action.payload;
            })
            .addCase(getAllUniverses.rejected, (state, action) => {
                if (action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(getUniverse.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUniverse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentUniverse = action.payload;
            })
            .addCase(getUniverse.rejected, (state, action) => {
                if(action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;              
            })
            .addCase(updateUniverse.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUniverse.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.allUniverses.findIndex((u) => u.universe_id === action.payload.universe_id);
                if (index !== -1){
                    state.allUniverses[index] = action.payload;
                }
                if (state.currentUniverse?.universe_id === action.payload.universe_id){
                    state.currentUniverse = action.payload;
                };
            })
            .addCase(updateUniverse.rejected, (state, action) => {
                if (action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteUniverse.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteUniverse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.allUniverses = state.allUniverses.filter(u => u.universe_id !== action.payload.universe_id)
            })
            .addCase(deleteUniverse.rejected, (state, action) => {
                if(action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
    },
})
export {createUniverse, getAllUniverses, getCurrentUniverse, updateUniverse, deleteUniverse }
export const { setCurrentUniverse } = universeSlice.actions;
export default universeSlice.reducer;