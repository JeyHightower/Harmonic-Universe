import { createSlice } from "@reduxjs/toolkit";
import { getCurrentNote } from "../../helpers";
import type { NoteState } from "../../types/note";
import { createNote, getAllNotes, getNote, updateNote, deleteNote } from "./noteActions";

const initialState: NoteState = {
    currentNote: getCurrentNote(),
    allNotes:[],
    isLoading: false,
    error: null
}

const noteSlice = createSlice({
    name: 'note',
    initialState,
    reducers: {
        setCurrentNote: (state, action) => {
            state.currentNote = action.payload;
            localStorage.setItem('activeNote', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(createNote.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(createNote.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.currentNote = action.payload;
            state.allNotes.push(action.payload);
        })
        .addCase(createNote.rejected, (state, action) => {
            if (action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(getAllNotes.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(getAllNotes.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.allNotes = action.payload;
        })
        .addCase(getAllNotes.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(getNote.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(getNote.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.currentNote = action.payload;
        })
        .addCase(getNote.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(updateNote.pending, (state) => {
            state.isLoading = false;
            state.error = null;
        })
        .addCase(updateNote.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            const index = state.allNotes.findIndex(n => n.note_id === action.payload.note_id);
            if (index !== -1){
                state.allNotes[index] = action.payload;
            }
            if(state.currentNote?.note_id === action.payload.note_id){
                state.currentNote = action.payload;
            }
        })
        .addCase(updateNote.rejected, (state, action) => {
            if (action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
        .addCase(deleteNote.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(deleteNote.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = null;
            state.allNotes.filter(n => n.note_id !== action.payload.note_id);
        })
        .addCase(deleteNote.rejected, (state, action) => {
            if(action.error.name === 'AbortError'){
                state.isLoading = false;
                return;
            }
            state.isLoading = false;
            state.error = action.payload as string;
        })
    }
})


export default noteSlice.reducer;
export const { setCurrentNote } = noteSlice.actions;
export {createNote, getNote, getAllNotes, updateNote, deleteNote }