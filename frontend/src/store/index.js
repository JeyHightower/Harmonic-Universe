import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import modalReducer from './slices/modalSlice';
import universeReducer from './slices/universeSlice';
import physicsParametersReducer from './slices/physicsParametersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
    universe: universeReducer,
    physicsParameters: physicsParametersReducer,
  },
});

export default store;
