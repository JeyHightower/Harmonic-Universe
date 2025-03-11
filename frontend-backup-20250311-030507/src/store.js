import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';

// Configure the Redux store
const store = configureStore({
    reducer: {
        auth: authReducer,
        // Add other reducers here as needed
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export default store;
