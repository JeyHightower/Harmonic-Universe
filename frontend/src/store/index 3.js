import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['universe/exportUniverse/fulfilled'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.config', 'payload.request', 'error', 'meta.arg'],
                // Ignore these paths in the state
                ignoredPaths: ['universe.error']
            }
        })
});

export default store;
