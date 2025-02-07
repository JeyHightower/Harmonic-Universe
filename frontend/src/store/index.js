import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import aiReducer from './slices/aiSlice';
import audioReducer from './slices/audioSlice';
import authReducer from './slices/authSlice';
import physicsReducer from './slices/physicsSlice';
import projectReducer from './slices/projectSlice';
import universeReducer from './slices/universeSlice';
import visualizationReducer from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    audio: audioReducer,
    visualization: visualizationReducer,
    ai: aiReducer,
    physics: physicsReducer,
    universe: universeReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionPaths: ['payload.timestamp', 'meta.arg'],
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export const getState = store.getState;
export const dispatch = store.dispatch;
