import { combineReducers } from '@reduxjs/toolkit';
import aiReducer from '../slices/aiSlice';
import audioReducer from '../slices/audioSlice';
import authReducer from '../slices/authSlice';
import physicsReducer from '../slices/physicsSlice';
import universeReducer from '../slices/universeSlice';
import visualizationReducer from '../slices/visualizationSlice';

// Import individual reducers here as they are created
// Example: import userReducer from './userSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  universe: universeReducer,
  physics: physicsReducer,
  audio: audioReducer,
  visualization: visualizationReducer,
  ai: aiReducer,
  // Add reducers here as they are created
  // Example: user: userReducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
