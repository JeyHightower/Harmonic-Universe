import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppLocation, LocationDraft, LocationResponse } from "../../types/location";
import { apiRequest } from "../../helpers";



export const createLocation = createAsyncThunk(
    'location/create',
    async (payload:LocationDraft & {universe_id:number}, thunkAPI) => {
        const { universe_id, ...locationData } = payload;
        const response = await apiRequest<LocationResponse>({
            url:`/api/universes/${universe_id}/locations`,
            method:'POST',
            signal: thunkAPI.signal,
            body: {...locationData, universe_id},
            thunkAPI
        });
        return response.Location;
    }
)

export const getAllLocationsInUniverse = createAsyncThunk(
    'locations/get', 
    async(universe_id:number, thunkAPI) => {
        const response = await apiRequest<{Message:string, Locations:AppLocation[]}>({
            url: `/api/universes/${universe_id}/locations`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
        return response.Locations;
    }
)

export const getLocation = createAsyncThunk(
    'location/get',
    async (location_id:number, thunkAPI) => {
        const response = await apiRequest<LocationResponse>({
            url: `/api/locations/${location_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
        return response.Location;
    }
)

export const updateLocation = createAsyncThunk(
    'location/update',
    async({locationData,location_id}: {locationData:LocationDraft, location_id:number}, thunkAPI) => {
        const response = await apiRequest<LocationResponse>({
            url: `api/locations/${location_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body:locationData,
            thunkAPI
        });
        return response.Location;
    }
)

export const deleteLocation = createAsyncThunk(
    'location/delete',
    async(location_id:number, thunkAPI) => {
        return await apiRequest<AppLocation>({
            url: `api/locations/${location_id}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)