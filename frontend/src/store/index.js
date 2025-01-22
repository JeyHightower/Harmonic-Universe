import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import analyticsReducer from './slices/analyticsSlice';
import audioReducer from './slices/audioSlice';
import authReducer from './slices/authSlice';
import preferencesReducer from './slices/preferencesSlice';
import universeReducer from './slices/universeSlice';

console.log('Configuring Redux store');

export const store = configureStore({
  reducer: {
    universe: universeReducer,
    auth: authReducer,
    audio: audioReducer,
    preferences: preferencesReducer,
    analytics: analyticsReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

// Log initial state
console.log('Initial store state:', store.getState());

// Subscribe to store changes
store.subscribe(() => {
  console.log('Store state updated:', store.getState());
});

console.log('Redux store configured successfully');

export * from './api';
export * from './slices/analyticsSlice';
export * from './slices/audioSlice';
export * from './slices/authSlice';
export * from './slices/preferencesSlice';
export * from './slices/universeSlice';
