import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppLocation, LocationDraft } from "../../types/location";
import { apiRequest } from "../../helpers";



export const createLocation = createAsyncThunk(
    'location/create',
    async ({locationData, universeId}:{locationData:LocationDraft, universeId:number}, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url:`/api/universes/${universeId}/locations`,
            method:'POST',
            signal: thunkAPI.signal,
            body: locationData,
            thunkAPI
        });
    }
)

export const getAllLocationsInUniverse = createAsyncThunk(
    'locations/get', 
    async(universeId, thunkAPI) => {
        return await apiRequest<AppLocation[]>({
            url: `/api/universes/${universeId}/locations`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)

export const getLocation = createAsyncThunk(
    'location/get',
    async (locationId, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `/api/locations/${locationId}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)

export const updateLocation = createAsyncThunk(
    'location/update',
    async({locationData,locationId}: {locationData:LocationDraft, locationId:number}, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `api/locations/${locationId}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body:locationData,
            thunkAPI
        });
    }
)

export const deleteLocation = createAsyncThunk(
    'location/delete',
    async(locationId, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `api/locations/${locationId}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)