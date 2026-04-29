import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../helpers';
import type { Universe, UniverseDraft, UniverseResponse } from '../../types/universe';


export const createUniverse = createAsyncThunk(
    'universe/create',
    async(universeData:UniverseDraft, thunkAPI) => {
        const response =  await apiRequest<UniverseResponse>({
            url:'/api/universes/',
            method:'POST',
            signal:thunkAPI.signal,
            body: universeData,
            thunkAPI
        });
        return response.universe;
    }
)


export const getAllUniverses = createAsyncThunk<Universe[], void>(
    'universes/get',
    async(_, thunkAPI) => {
        const response =  await apiRequest<{Message:string; universes:Universe[]}>({
            url: '/api/universes/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.universes
    }
)

export const getUniverse = createAsyncThunk(
    'universe/get',
    async(universe_id:number, thunkAPI) => {
        const response = await apiRequest<UniverseResponse>({
            url:`/api/universes/${universe_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.universe;
    }
)

export const updateUniverse = createAsyncThunk(
    'universe/update',
    async({universe_id, universeData}: {universe_id:number,universeData:UniverseDraft }, thunkAPI ) => {
        const response =  await apiRequest<UniverseResponse>({
            url: `/api/universes/${universe_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: universeData,
            thunkAPI
        });
      return  response.universe;
    }
)

export const deleteUniverse = createAsyncThunk(
    'universe/delete',
    async(universe_id:number, thunkAPI) => {
        return await apiRequest<Universe>({
            url:`/api/universes/${universe_id}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)