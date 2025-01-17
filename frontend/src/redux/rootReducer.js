import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import musicReducer from './slices/musicSlice';
import physicsReducer from './slices/physicsSlice';
import storyboardReducer from './slices/storyboardSlice';
import universeReducer from './slices/universeSlice';
import userReducer from './slices/userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  universe: universeReducer,
  user: userReducer,
  physics: physicsReducer,
  music: musicReducer,
  storyboard: storyboardReducer,
});

export default rootReducer;
