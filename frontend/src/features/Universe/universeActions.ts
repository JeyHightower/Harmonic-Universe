import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../helpers';
import type { Universe, UniverseDraft } from '../../types/universe';


export const createUniverse = createAsyncThunk(
    'universe/create',
    async(universeData:UniverseDraft, thunkAPI) => {
        return await apiRequest<Universe>({
            url:'/api/universes/',
            method:'POST',
            signal:thunkAPI.signal,
            body: universeData,
            thunkAPI
        });
    }
)


export const getAllUniverses = createAsyncThunk(
    'universes/get',
    async(_, thunkAPI) => {
        return await apiRequest<Universe[]>({
            url: '/api/universes/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const getUniverse = createAsyncThunk(
    'universe/get',
    async(universeId:number, thunkAPI) => {
        return await apiRequest<Universe>({
            url:`/api/universes/${universeId}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const updateUniverse = createAsyncThunk(
    'universe/update',
    async({universeId, universeData}: {universeId:number,universeData:UniverseDraft }, thunkAPI ) => {
        return await apiRequest<Universe>({
            url: `/api/universes/${universeId}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: universeData,
            thunkAPI
        });
    }
)

export const deleteUniverse = createAsyncThunk(
    'universe/delete',
    async(universeId:number, thunkAPI) => {
        return await apiRequest({
            url:`/api/universes/${universeId}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)