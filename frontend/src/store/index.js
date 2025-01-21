import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

console.log('Configuring Redux store');

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Log initial state
console.log('Initial store state:', store.getState());

// Subscribe to store changes
store.subscribe(() => {
  console.log('Store state updated:', store.getState());
});

console.log('Redux store configured successfully');

export default store;
