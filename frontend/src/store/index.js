import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import modalReducer from './slices/modalSlice';
import physicsObjectsReducer from './slices/physicsObjectsSlice';
import physicsParametersReducer from './slices/physicsParametersSlice';
import scenesReducer from './slices/scenesSlice';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
    universe: universeReducer,
    scenes: scenesReducer,
    physicsParameters: physicsParametersReducer,
    physicsObjects: physicsObjectsReducer,
  },
});

export default store;
