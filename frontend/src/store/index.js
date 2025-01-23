import { configureStore } from '@reduxjs/toolkit';
import analyticsReducer from './slices/analyticsSlice';
import authReducer from './slices/authSlice';
import commentReducer from './slices/commentSlice';
import favoriteReducer from './slices/favoriteSlice';
import musicReducer from './slices/musicSlice';
import notificationsReducer from './slices/notificationsSlice';
import physicsReducer from './slices/physicsSlice';
import preferencesReducer from './slices/preferencesSlice';
import storyboardReducer from './slices/storyboardSlice';
import templateReducer from './slices/templateSlice';
import universeReducer from './slices/universeSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    analytics: analyticsReducer,
    music: musicReducer,
    notifications: notificationsReducer,
    user: userReducer,
    storyboard: storyboardReducer,
    preferences: preferencesReducer,
    comments: commentReducer,
    templates: templateReducer,
    physics: physicsReducer,
    favorites: favoriteReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['universe/setPhysicsEngine', 'music/setAudioContext'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.engine', 'payload.context'],
        // Ignore these paths in the state
        ignoredPaths: ['universe.physicsEngine', 'music.audioContext'],
      },
    }),
});

export default store;
