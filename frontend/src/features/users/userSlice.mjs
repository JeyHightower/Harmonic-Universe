import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


export const fetchUsers = createAsyncThunk('users/fetchUsers', async() => {
    const response = await axios.get('/api/users/')
})