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
    async (character_id:number, thunkAPI) => {
        return await apiRequest<Character>({
            url: `/characters/${character_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const updateCharacter = createAsyncThunk(
    'character/update', 
    async({character_id, characterData}:{character_id:number,characterData:CharacterDraft}, thunkAPI) => {
        return await apiRequest<Character>({
            url: `/api/characters/${character_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: characterData,
            thunkAPI
        });
    }
)

export const deleteCharacter = createAsyncThunk(
    'character/delete',
    async(character_id:number, thunkAPI) => {
        return await apiRequest<Character>({
            url:`/api/characters/${character_id}`,
            method:'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)