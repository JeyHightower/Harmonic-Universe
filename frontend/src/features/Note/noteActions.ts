import { createAsyncThunk } from "@reduxjs/toolkit";
import type { NoteDraft, Note } from "../../types/note";
import { apiRequest } from "../../helpers";



export const createNote = createAsyncThunk(
    'note/create',
    async (noteData:NoteDraft, thunkAPI) => {
        return await apiRequest<Note>({
            url:'/api/notes/',
            method: 'POST',
            signal: thunkAPI.signal,
            body: noteData,
            thunkAPI
        });
    }
)

export const getAllNotes = createAsyncThunk(
    'notes/get',
    async(_, thunkAPI) => {
        return await apiRequest<Note[]>({
            url: '/api/notes/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const getNote = createAsyncThunk(
    'note/get',
    async(noteId:number, thunkAPI) => {
        return await apiRequest<Note>({
            url: `/api/notes/${noteId}`,
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)

export const updateNote = createAsyncThunk(
    'note/update',
    async ({noteId, noteData}: {noteId: number, noteData: NoteDraft}, thunkAPI) => {
        return await apiRequest<Note>({
            url: `/api/notes/${noteId}`,
            method: 'PATCH',
            signal: thunkAPI.signal,
            body: noteData,
            thunkAPI
        });
    }
)

export const deleteNote = createAsyncThunk(
    'note/delete',
    async(noteId: number, thunkAPI) => {
        return apiRequest<Note>({
            url: `/api/notes/${noteId}`,
            method: 'DELETE',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        })
    }
)
