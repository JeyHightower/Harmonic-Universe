import { configureStore } from '@reduxjs/toolkit';
import universeReducer from './slices/universeSlice';
import sceneReducer from './slices/sceneSlice';
import physicsObjectsReducer from './slices/physicsObjectsSlice';
import physicsParametersReducer from './slices/physicsParametersSlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    universes: universeReducer,
    scenes: sceneReducer,
    physicsObjects: physicsObjectsReducer,
    physicsParameters: physicsParametersReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
