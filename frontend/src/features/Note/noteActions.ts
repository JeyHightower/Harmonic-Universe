import { createAsyncThunk } from "@reduxjs/toolkit";
import type { NoteDraft, Note, NoteResponse } from "../../types/note";
import { apiRequest } from "../../helpers";



export const createNote = createAsyncThunk(
    'note/create',
    async (noteData:NoteDraft, thunkAPI) => {
        const response = await apiRequest<NoteResponse>({
            url:'/api/notes/',
            method: 'POST',
            signal: thunkAPI.signal,
            body: noteData,
            thunkAPI
        });
        return response.Note;
    }
)

export const getAllNotes = createAsyncThunk(
    'notes/get',
    async(_, thunkAPI) => {
        const response = await apiRequest<{Message:string, Notes:Note[]}>({
            url: '/api/notes/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.Notes;
    }
)

export const getNote = createAsyncThunk(
    'note/get',
    async(note_id:number, thunkAPI) => {
        const response = await apiRequest<NoteResponse>({
            url: `/api/notes/${note_id}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
        return response.Note;
    }
)

export const updateNote = createAsyncThunk(
    'note/update',
    async ({note_id, noteData}: {note_id: number, noteData: NoteDraft}, thunkAPI) => {
        const response = await apiRequest<NoteResponse>({
            url: `/api/notes/${note_id}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: noteData,
            thunkAPI
        });
        return response.Note;
    }
)

export const deleteNote = createAsyncThunk(
    'note/delete',
    async(note_id: number, thunkAPI) => {
        return apiRequest<Note>({
            url: `/api/notes/${note_id}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)
