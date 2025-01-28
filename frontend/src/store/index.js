import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import collaboratorReducer from './slices/collaboratorSlice';
import commentReducer from './slices/commentSlice';
import uiReducer from './slices/uiSlice';
import universeReducer from './slices/universeSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    user: userReducer,
    ui: uiReducer,
    collaborators: collaboratorReducer,
    comments: commentReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.created_at', 'auth.user.updated_at'],
      },
    }),
});

export default store;
