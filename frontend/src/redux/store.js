import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './slices/notificationSlice';
import preferencesReducer from './slices/preferencesSlice';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    preferences: preferencesReducer,
    universe: universeReducer,
  },
});

export default store;
