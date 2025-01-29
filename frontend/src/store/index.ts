import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import mediaEffectReducer from './slices/mediaEffectSlice';
import sceneReducer from './slices/sceneSlice';
import storyboardReducer from './slices/storyboardSlice';
import uiReducer from './slices/uiSlice';
import universeReducer from './slices/universeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    storyboard: storyboardReducer,
    scene: sceneReducer,
    mediaEffect: mediaEffectReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'auth/login/fulfilled',
          'auth/register/fulfilled',
          'universe/exportUniverse/fulfilled',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.timestamp',
          'payload.config',
          'payload.request',
          'error',
          'meta.arg',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user.created_at',
          'auth.user.updated_at',
          'universe.error',
          'storyboard.error',
          'scene.error',
          'mediaEffect.error',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
