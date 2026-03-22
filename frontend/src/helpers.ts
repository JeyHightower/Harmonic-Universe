import type { User } from "./types/user";
import type { ApiRequestConfig } from "./types/api";
import type { Universe } from "./types/universe";
import type { Character } from "./types/character";
import type { AuthState, LoginResponse, RegisterResponse } from "./types/auth";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Note } from "./types/note";
import type { AppLocation } from "./types/location";
import { useAppDispatch } from "./hooks/useUniversalToolbox";
import { useNavigate } from "react-router-dom";


export const getInitialToken = ():string | null => {
    return localStorage.getItem('token')
};

export const getInitialUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null
};

export const apiRequest = async <T> (config: ApiRequestConfig):Promise<T> => {
    const { url, method, body, thunkAPI, signal } = config;
    const token = getInitialToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if(token){
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!token && method !== 'POST') {
        return thunkAPI.rejectWithValue('No Authorization token found.');
    }
    try {
        const response = await fetch( url, {
            method,
            signal,
            headers,
            body: body ? JSON.stringify(body): undefined,
        });
        const data = await response.json();
        if(!response.ok){
            if(response.status === 401) {
                localStorage.removeItem('token');
                return thunkAPI.rejectWithValue('Session expired. Please Login again ')
            }
            return thunkAPI.rejectWithValue(data.message || 'Request Failed.')
        }
        return data as T;

    }
    catch (error) {
        if(error instanceof DOMException && error.name === 'AbortError'){
            return thunkAPI.rejectWithValue('Request aborted.');
        }
        return thunkAPI.rejectWithValue('Network Connection failed.')
    }
};

export const handleAuthSuccess = (state: AuthState, action: PayloadAction<LoginResponse | RegisterResponse> ) => {
    state.isLoading = false;
    state.isAuthenticated = true;
    state.user = action.payload.user;
    state.token = action.payload.token;
    localStorage.setItem('token', action.payload.token)
}

export const getCurrentUniverse = (): Universe | null => {
    const universe = localStorage.getItem('activeUniverse');
    if(!universe) return null;
    try{
        return JSON.parse(universe) as Universe;
    }
     catch(error){
        console.error('failed to parse universe data', error);
        return null;
    }
}

export const getCurrentCharacter = () => {
    const character = localStorage.getItem('activeCharacter')
    if(!character) return null;
    try{
        return JSON.parse(character) as Character;
    } 
    catch(error){
        console.error('failed to parse character data', error);
        return null;
    }
}

export const getCurrentNote = () => {
    const note = localStorage.getItem('activeNote')
    if (!note) return null;
    try{
        return JSON.parse(note) as Note;
    }
    catch(error){
        console.error('failed to parse character Data', error)
        return null;
    }
}


export const getCurrentLocation = () => {
    const appLocation = localStorage.getItem('activeLocation')
    if(!appLocation) return null;
    try{
        return JSON.parse(appLocation) as AppLocation;
    }
    catch(error){
        console.error('failed to parse location data', error)
        return null;
    }
}

export const handleEnter = (func:Function,instOfModel:object, url:string ) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    dispatch(func(instOfModel));
    navigate(url);
}
