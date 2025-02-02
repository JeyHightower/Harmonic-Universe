import { combineReducers } from '@reduxjs/toolkit';

// Import individual reducers here as they are created
// Example: import userReducer from './userSlice';

const rootReducer = combineReducers({
  // Add reducers here as they are created
  // Example: user: userReducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
