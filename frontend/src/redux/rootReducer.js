import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import universeReducer from './slices/universeSlice';
import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  universe: universeReducer,
  user: userReducer,
});

export default rootReducer;
