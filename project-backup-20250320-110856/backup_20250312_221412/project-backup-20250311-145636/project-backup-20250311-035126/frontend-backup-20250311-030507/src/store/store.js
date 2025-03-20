import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import modalReducer from './slices/modalSlice';
import physicsObjectsReducer from './slices/physicsObjectsSlice';
import scenesReducer from './slices/scenesSlice';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
    universe: universeReducer,
    physicsObjects: physicsObjectsReducer,
    scenes: scenesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
