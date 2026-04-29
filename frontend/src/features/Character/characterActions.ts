import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../helpers";
import type { Character, CharacterDraft, CharacterResponse } from "../../types/character";

export const createCharacter = createAsyncThunk(
    'character/create',
    async(characterData:CharacterDraft, thunkAPI) => {
        const response =  await apiRequest<CharacterResponse>({
            url: '/api/characters/',
            method: 'POST',
            signal: thunkAPI.signal,
            body: characterData,
            thunkAPI
        });
        return response.character;
    }
)

export const getAllCharacters = createAsyncThunk(
    'characters/get',
    async (_, thunkAPI) => {
        const response =  await apiRequest<{Message:string, character:Character[]}>({
            url: '/api/characters/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.character
    }
)

export const getCharacter = createAsyncThunk(
    'character/get',
    async (character_id:number, thunkAPI) => {
        const response = await apiRequest<CharacterResponse>({
            url: `/characters/${character_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.character;
    }
)

export const updateCharacter = createAsyncThunk(
    'character/update', 
    async({character_id, characterData}:{character_id:number,characterData:CharacterDraft}, thunkAPI) => {
        const response =  await apiRequest<CharacterResponse>({
            url: `/api/characters/${character_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: characterData,
            thunkAPI
        });
       return response.character;
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