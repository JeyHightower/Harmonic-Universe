import type { User } from "./types/user";
import type { ApiRequestConfig } from "./types/api";
import type { Character } from "./types/character";
import type { AuthState, LoginResponse, RegisterResponse } from "./types/auth";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Note } from "./types/note";
import type { AppLocation } from "./types/location";
import type { RootState } from "./types/universal";



//! FUNCTIONS

export const getInitialToken = (): string | null => {
    return localStorage.getItem('token')
};

export const getInitialUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null
};

export const apiRequest = async <T>(config: ApiRequestConfig): Promise<T> => {
    const { url, method, body, thunkAPI, signal } = config;
    const state = thunkAPI.getState() as RootState;
    const token = state.auth.token;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token && token !== "undefined" && token !== "null") {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!token && method !== 'POST') {
        return thunkAPI.rejectWithValue('No Authorization token found.');
    }
    try {
        const response = await fetch(url, {
            method,
            signal,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                return thunkAPI.rejectWithValue('Session expired. Please Login again ')
            }
            return thunkAPI.rejectWithValue(data.message || 'Request Failed.')
        }
        return data as T;

    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return thunkAPI.rejectWithValue('Request aborted.');
        }
        return thunkAPI.rejectWithValue('Network Connection failed.')
    }
};

export const handleAuthSuccess = (state: AuthState, action: PayloadAction<LoginResponse | RegisterResponse>) => {
    state.isLoading = false;
    state.isAuthenticated = true;
    state.user = action.payload.user;
    state.token = action.payload.access_token;
    localStorage.setItem('token', action.payload.access_token)
}



export const getCurrentCharacter = (): Character | null => {
    const character = localStorage.getItem('activeCharacter')
    if (!character) return null;
    try {
        return JSON.parse(character) as Character;
    }
    catch (error) {
        console.error('failed to parse character data', error);
        return null;
    }
}

export const getCurrentNote = (): Note | null => {
    const note = localStorage.getItem('activeNote')
    if (!note) return null;
    try {
        return JSON.parse(note) as Note;
    }
    catch (error) {
        console.error('failed to parse character Data', error)
        return null;
    }
}


export const getCurrentLocation = (): AppLocation | null => {
    const appLocation = localStorage.getItem('activeLocation')
    if (!appLocation) return null;
    try {
        return JSON.parse(appLocation) as AppLocation;
    }
    catch (error) {
        console.error('failed to parse location data', error)
        return null;
    }
}


//! Objects

export const FORM_CONFIG = {
    user: [
        { name: 'name', label: 'User Name', type: 'text', placeholder: 'e.g John Smith' },
        { name: 'username', label: 'Username', type: 'text', placeholder: 'e.g JohnnyBoy' },
        { name: 'email', label: 'Email', type: 'text', placeholder: 'e.g John@example.com' },
        { name: 'password', label: 'Password', type: 'text', placeholder: 'e.g password0001' },
        { name: 'bio', label: 'Biography', type: 'textarea', placeholder: 'e.g Hello my name is John and I like sports.' }
    ],
    universe: [
        { name: 'name', label: 'Universe Name', type: 'text', placeholder: 'e.g Milky Way' },
        { name: 'description', label: 'Description of Universe', type: 'textarea', placeholder: 'e.g Milky Way contains billions of stars.' },
        {
            name: 'alignment', label: 'Choose if your Universe is good, bad, neutral', type: 'select', options: [
                { value: 'good', label: 'Good' },
                { value: 'bad', label: 'Bad' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'chaotic', label: 'Chaotic' },
                { value: 'lawful', label: 'Lawful' }]
        },
    ],
    character: [
        { name: 'name', label: 'Character Name', type: 'text', placeholder: 'e.g Jane Smith' },
        { name: 'age', label: 'Characters age', type: 'number', placeholder: 'e.g 20' },
        { name: 'origin', label: 'Origin Story', type: 'textarea', placeholder: 'e.g From the city of...gained abilities through...' },
        { name: 'main_power_set', label: 'Primary Power/Ability', placeholder: 'e.g Fire' },
        { name: 'secondary_power_set', label: 'Secondary Power/Ability', placeholder: 'e.g Telekenesis' },
        { name: 'skills', label: 'List of specialized skills', placeholder: 'e.g Hacking, Manipulation' }
    ],
    note: [
        { name: 'title', label: 'Note Title', type: 'text', placeholder: 'e.g Future Ideas' },
        { name: 'content', label: 'Content of the note', type: 'textarea', placeholder: 'write whatever you wish' }
    ],
    location: [
        { name: 'name', label: 'Name of Location', type: 'text', placeholder: 'e.g Central Park' },
        {
            name: 'location_type', label: 'Type of Location', type: 'select', options: [
                { value: 'galaxy', label: 'Galaxy' },
                { value: 'system', label: 'System' },
                { value: 'planet', label: 'Planet' },
                { value: 'continent', label: 'Continent' },
                { value: 'kingdom', label: 'Kingdom' },
                { value: 'state', label: 'State' },
                { value: 'city', label: 'City' },
                { value: 'town', label: 'Town' },
                { value: 'village', label: 'Village' },
                { value: 'street', label: 'Street' },
                { value: 'building', label: 'Building' },
                { value: 'room', label: 'Room' },
                { value: 'landmark', label: 'Landmark' }
            ], placeholder: 'Pick your location type.'
        },
    ]
};