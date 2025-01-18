import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import universeReducer from './slices/universeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
