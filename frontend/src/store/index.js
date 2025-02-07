import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import aiReducer from './slices/aiSlice';
import audioReducer from './slices/audioSlice';
import authReducer from './slices/authSlice';
import physicsReducer from './slices/physicsSlice';
import universeReducer from './slices/universeSlice';
import visualizationReducer from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    audio: audioReducer,
    universe: universeReducer,
    visualization: visualizationReducer,
    physics: physicsReducer,
    ai: aiReducer,
    auth: authReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['universe/updateRealtimeStatus'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket', 'payload.connection'],
        // Ignore these paths in the state
        ignoredPaths: ['universe.realtimeStatus.socket'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export const getState = store.getState;
export const dispatch = store.dispatch;
