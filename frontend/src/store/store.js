import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import authReducer from "./slices/authSlice";
import universeReducer from "./slices/universeSlice";
import scenesReducer from "./slices/scenesSlice";
import characterReducer from "./slices/characterSlice";
import noteReducer from "./slices/noteSlice";
import modalReducer from "./slices/modalSlice";

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
    }
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
  key: "auth",
  storage: getStorage(),
  whitelist: ["user", "isAuthenticated"],
  blacklist: ["isLoading", "error", "authError"],
  writeFailHandler: handlePersistError,
};

// Configure persistence for other reducers
const universesPersistConfig = {
  key: "universes",
  storage: getStorage(),
  whitelist: ["universes", "currentUniverse"],
  blacklist: ["loading", "error", "success"],
  writeFailHandler: handlePersistError,
};

const scenesPersistConfig = {
  key: "scenes",
  storage: getStorage(),
  whitelist: ["scenes", "locallyCreatedScenes", "universeScenes"],
  blacklist: ["loading", "error", "success", "currentScene"],
  writeFailHandler: handlePersistError,
};

// Root persist config
const persistConfig = {
  key: "root",
  version: 1,
  storage: getStorage(),
  whitelist: [], // Don't persist anything at root level
  blacklist: ["modal"], // Never persist modal state
  writeFailHandler: handlePersistError,
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  universes: persistReducer(universesPersistConfig, universeReducer),
  scenes: persistReducer(scenesPersistConfig, scenesReducer),
  characters: characterReducer,
  notes: noteReducer,
  modal: modalReducer, // No persisting for modal state
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
export default store;
