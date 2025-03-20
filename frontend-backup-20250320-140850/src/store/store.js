import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import modalReducer from './modalSlice';
import physicsObjectsReducer from './physicsObjectsSlice';
import scenesReducer from './scenesSlice';
import universeReducer from './universeSlice';

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
