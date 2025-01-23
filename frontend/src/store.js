import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './store/slices/audioSlice';
import authReducer from './store/slices/authSlice';
import physicsReducer from './store/slices/physicsSlice';
import universeReducer from './store/slices/universeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    audio: audioReducer,
    physics: physicsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
