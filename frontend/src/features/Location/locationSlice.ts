import { createSlice } from "@reduxjs/toolkit";
import { getCurrentLocation } from "../../helpers";
import type { LocationState } from "../../types/location";
import { createLocation, deleteLocation, getAllLocationsInUniverse, getLocation, updateLocation } from "./locationActions";


const initialState: LocationState = {
    currentLocation: getCurrentLocation(),
    allLocations: [],
    isLoading: false,
    error: null
}


const locationSlice = createSlice ({
    name: 'location',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(createLocation.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(createLocation.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.currentLocation = action.payload;
            state.allLocations.push(action.payload);
        })
        .addCase(createLocation.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(getAllLocationsInUniverse.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(getAllLocationsInUniverse.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.allLocations = action.payload;
        })
        .addCase(getAllLocationsInUniverse.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(getLocation.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(getLocation.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.currentLocation = action.payload;
        })
        .addCase(getLocation.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(updateLocation.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(updateLocation.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            const index = state.allLocations.findIndex(l => l.locationId === action.payload.locationId);
            if (index !== -1){
                state.allLocations[index] = action.payload;
            }
            if(state.currentLocation?.locationId === action.payload.locationId){
                state.currentLocation = action.payload;
            }
        })
        .addCase(updateLocation.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(deleteLocation.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(deleteLocation.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null
            state.allLocations = state.allLocations.filter(l => l.locationId !== action.payload.locationId)
        })
        .addCase(deleteLocation.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
    }
})

export default locationSlice.reducer;
export { createLocation, getAllLocationsInUniverse, getLocation, updateLocation, deleteLocation }