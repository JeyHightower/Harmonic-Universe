import { api } from '@/services/api';
import { apiSlice } from '@/services/apiSlice';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import aiReducer from './slices/aiSlice';
import audioReducer from './slices/audioSlice';
import authReducer from './slices/authSlice';
import collaborationReducer from './slices/collaborationSlice';
import physicsReducer from './slices/physicsSlice';
import universeReducer from './slices/universeSlice';
import visualizationReducer from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    audio: audioReducer,
    universe: universeReducer,
    visualization: visualizationReducer,
    physics: physicsReducer,
    ai: aiReducer,
    auth: authReducer,
    collaboration: collaborationReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api.middleware, apiSlice.middleware),
  devTools: import.meta.env.VITE_DEBUG_MODE === 'true',
});

setupListeners(store.dispatch);

export const getState = store.getState;
export const dispatch = store.dispatch;

export default store;
