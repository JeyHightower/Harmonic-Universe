import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import modalMiddleware from './middleware/newModalMiddleware';
import audioReducer from './slices/audioSlice.mjs';
import authReducer from './slices/authSlice.mjs';
import characterReducer from './slices/characterSlice.mjs';
import modalReducer from './slices/newModalSlice.js';
import noteReducer from './slices/noteSlice.mjs';
import scenesReducer from './slices/scenesSlice.mjs';
import universeReducer from './slices/universeSlice.mjs';

// Create a more resilient storage reference
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Get appropriate storage mechanism
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return storage;
  }
  return createNoopStorage();
};

// Persist error handler
const handlePersistError = (err) => {
  console.warn('Redux persist error:', err);
  // Don't throw error to prevent app from breaking
  return null;
};

// Configure persistence for auth state
const authPersistConfig = {
  key: 'auth',
  storage: getStorage(),
  whitelist: ['user', 'isAuthenticated'],
  blacklist: ['isLoading', 'error', 'authError'],
  writeFailHandler: handlePersistError,
  stateReconciler: (inboundState, originalState, reducedState, { debug }) => {
    // Always prioritize inbound authenticated state if it exists
    if (inboundState.isAuthenticated) {
      return {
        ...reducedState,
        ...inboundState,
        isLoading: false, // Never persist loading state
        error: null, // Clear any errors on rehydration
      };
    }
    return reducedState;
  },
};

// Configure persistence for other reducers
const universesPersistConfig = {
  key: 'universes',
  storage: getStorage(),
  whitelist: ['universes', 'currentUniverse'],
  blacklist: ['loading', 'error', 'success'],
  writeFailHandler: handlePersistError,
};

const scenesPersistConfig = {
  key: 'scenes',
  storage: getStorage(),
  whitelist: ['scenes', 'locallyCreatedScenes', 'universeScenes'],
  blacklist: ['loading', 'error', 'success', 'currentScene'],
  writeFailHandler: handlePersistError,
};

// Audio state persistence configuration - only persist browser detection info
const audioPersistConfig = {
  key: 'audio',
  storage: getStorage(),
  whitelist: ['iOS', 'safari'], // Only persist browser detection
  blacklist: ['initializing', 'initialized', 'error', 'contextState'],
  writeFailHandler: handlePersistError,
};

// Root persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage: getStorage(),
  whitelist: [], // Don't persist anything at root level
  blacklist: ['modal', 'audio'], // Never persist modal state or audio state at root level
  writeFailHandler: handlePersistError,
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  universes: persistReducer(universesPersistConfig, universeReducer),
  scenes: persistReducer(scenesPersistConfig, scenesReducer),
  characters: characterReducer,
  notes: noteReducer,
  modal: modalReducer, // No persisting for modal state
  audio: persistReducer(audioPersistConfig, audioReducer), // Add audio reducer with minimal persistence
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore non-serializable values in specific paths
        ignoredActionPaths: ['payload.props.onSuccess', 'meta.arg.props.onSuccess'],
        ignoredPaths: ['modal.props.onSuccess'],
      },
    }).concat(modalMiddleware),
  devTools: import.meta.env.MODE !== 'production',
});

export const persistor = persistStore(store);
export default store;
