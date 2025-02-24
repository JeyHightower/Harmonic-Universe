import { configureStore } from '@reduxjs/toolkit';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    universe: universeReducer,
  },
});

export default store;
