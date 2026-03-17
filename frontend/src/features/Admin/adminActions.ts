import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../helpers";
import type { User } from "../../types/user";


export const getAllUsers = createAsyncThunk(
    'admin/getAllUsers',
    async(_, thunkAPI) => {
        return await apiRequest<User[]>({
            url: '/api/users/',
            method: 'GET',
            signal: thunkAPI.signal,
            body: null,
            thunkAPI
        });
    }
)
