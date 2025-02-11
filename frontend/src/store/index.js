import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import reducers
import audioReducer from './slices/audioSlice';
import authReducer from './slices/authSlice';
import modalReducer from './slices/modalSlice';
import physicsReducer from './slices/physicsSlice';
import universeReducer from './slices/universeSlice';
import visualizationReducer from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    physics: physicsReducer,
    audio: audioReducer,
    visualization: visualizationReducer,
    modal: modalReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export default store;
