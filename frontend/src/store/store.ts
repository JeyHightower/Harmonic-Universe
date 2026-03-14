import { configureStore } from '@reduxjs/toolkit';
import { apislice } from '../api/apiSlice';
import authReducer from '../features/Auth/authSlice';
import universeReducer from '../features/Universe/universeSlice';
import characterReducer from '../features/Character/characterSlice';
import noteReducer from '../features/Note/noteSlice';
import locationReducer from '../features/Location/locationSlice';
import adminReducer from '../features/Admin/adminSlice';

export const store = configureStore({
    reducer: {
        [apislice.reducerPath]: apislice.reducer,
        auth: authReducer,
        universe: universeReducer,
        character: characterReducer,
        note: noteReducer,
        location: locationReducer,
        admin: adminReducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(apislice.middleware),
});

