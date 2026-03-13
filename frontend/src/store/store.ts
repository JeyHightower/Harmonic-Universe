import { configureStore } from '@reduxjs/toolkit';
import { apislice } from '../api/apiSlice';
import authReducer from '../features/Auth/authSlice';
import universeReducer from '../features/Universe/universeSlice';

export const store = configureStore({
    reducer: {
        [apislice.reducerPath]: apislice.reducer,
        auth: authReducer,
        universe: universeReducer
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(apislice.middleware),
});

