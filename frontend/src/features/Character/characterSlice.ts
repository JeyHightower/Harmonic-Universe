import { createSlice } from "@reduxjs/toolkit";
import { getCurrentCharacter } from "../../helpers";
import {type CharacterState } from "../../types/character";
import { createCharacter, getAllCharacters, getCharacter, updateCharacter, deleteCharacter } from "./characterActions";

const initialState: CharacterState = {
    currentCharacter: getCurrentCharacter(),
    allCharacters : [],
    isLoading: false,
    error: null     
}   

const characterSlice = createSlice({
    name: 'character',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createCharacter.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createCharacter.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.currentCharacter = action.payload;
                state.allCharacters.push(action.payload);
            })
            .addCase(createCharacter.rejected, (state, action) => {
                if(action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return ;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(getAllCharacters.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllCharacters.fulfilled, (state, action) => {
                state.isLoading = false;
                state. error = null;
                state.allCharacters = action.payload;
            })
            .addCase(getAllCharacters.rejected, (state, action) => {
                if(action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(getCharacter.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCharacter.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.currentCharacter = action.payload;
            })
            .addCase(getCharacter.rejected, (state, action) => {
                if(action.error.name === 'AbortError') {
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateCharacter.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateCharacter.fulfilled, (state, action) => {
                state.isLoading =false;
                state.error = null;
                const index = state.allCharacters.findIndex(c => c.characterId === action.payload.characterId)
                if(index !== -1 ){
                    state.allCharacters[index] = action.payload;
                }
                if (state.currentCharacter?.characterId === action.payload.characterId){
                    state.currentCharacter = action.payload
                };
            })
            .addCase(deleteCharacter.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteCharacter.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.allCharacters = state.allCharacters.filter(c => c.characterId !== action.payload.characterId)
            })
            .addCase(deleteCharacter.rejected, (state, action) => {
                if(action.error.name === 'AbortError'){
                    state.isLoading = false;
                    return;
                }
                state.isLoading = false;
                state.error = action.payload as string;
            })

    },
})


export default characterSlice.reducer;
export{ createCharacter, getAllCharacters, getCharacter, updateCharacter, deleteCharacter};