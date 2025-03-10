import { configureStore } from '@reduxjs/toolkit';
import physicsObjectsReducer from './slices/physicsObjectsSlice';
import universeReducer from './slices/universeSlice';
import scenesReducer from './slices/scenesSlice';

const store = configureStore({
  reducer: {
    universe: universeReducer,
    physicsObjects: physicsObjectsReducer,
    scenes: scenesReducer,
  },
});

export default store;
