import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './redux/slices/audioSlice';
import authReducer from './redux/slices/authSlice';
import physicsReducer from './redux/slices/physicsSlice';
import universeReducer from './redux/slices/universeSlice';

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
