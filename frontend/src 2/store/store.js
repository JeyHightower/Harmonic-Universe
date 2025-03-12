import { configureStore } from '@reduxjs/toolkit';
import physicsObjectsReducer from './slices/physicsObjectsSlice';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    universe: universeReducer,
    physicsObjects: physicsObjectsReducer,
  },
});

export default store;
