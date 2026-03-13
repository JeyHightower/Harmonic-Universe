import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../helpers";
import type { Character, CharacterDraft } from "../../types/character";

export const createCharacter = createAsyncThunk(
    'character/create',
    async(characterData:CharacterDraft, thunkAPI) => {
        return await apiRequest<Character>({
            url: '/api/characters/',
            method: 'POST',
            signal: thunkAPI.signal,
            body: characterData,
            thunkAPI
        });
    }
)

export const getAllCharacters = createAsyncThunk(
    'characters/get',
    async (_, thunkAPI) => {
        return await apiRequest<Character[]>({
            url: '/api/characters/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const getCharacter = createAsyncThunk(
    'character/get',
    async (characterId:number, thunkAPI) => {
        return await apiRequest<Character>({
            url: `/characters/${characterId}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const updateCharacter = createAsyncThunk(
    'character/update', 
    async({characterId, characterData}:{characterId:number,characterData:CharacterDraft}, thunkAPI) => {
        return await apiRequest<Character>({
            url: `/api/characters/${characterId}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: characterData,
            thunkAPI
        });
    }
)

export const deleteCharacter = createAsyncThunk(
    'character/delete',
    async(characterId:number, thunkAPI) => {
        return await apiRequest<Character>({
            url:`/api/characters/${characterId}`,
            method:'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)