import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppLocation, LocationDraft } from "../../types/location";
import { apiRequest } from "../../helpers";



export const createLocation = createAsyncThunk(
    'location/create',
    async ({locationData, universe_id}:{locationData:LocationDraft, universe_id:number}, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url:`/api/universes/${universe_id}/locations`,
            method:'POST',
            signal: thunkAPI.signal,
            body: locationData,
            thunkAPI
        });
    }
)

export const getAllLocationsInUniverse = createAsyncThunk(
    'locations/get', 
    async(universe_id, thunkAPI) => {
        return await apiRequest<AppLocation[]>({
            url: `/api/universes/${universe_id}/locations`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)

export const getLocation = createAsyncThunk(
    'location/get',
    async (location_id, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `/api/locations/${location_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)

export const updateLocation = createAsyncThunk(
    'location/update',
    async({locationData,location_id}: {locationData:LocationDraft, location_id:number}, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `api/locations/${location_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body:locationData,
            thunkAPI
        });
    }
)

export const deleteLocation = createAsyncThunk(
    'location/delete',
    async(location_id, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `api/locations/${location_id}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)