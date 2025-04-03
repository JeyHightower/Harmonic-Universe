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

// Configure persistence for auth state
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated"],
  blacklist: ["isLoading", "error", "authError"],
};

// Configure persistence for other reducers
const universesPersistConfig = {
  key: "universes",
  storage,
  whitelist: ["universes", "currentUniverse"],
  blacklist: ["loading", "error", "success"],
};

const scenesPersistConfig = {
  key: "scenes",
  storage,
  whitelist: ["scenes", "locallyCreatedScenes", "universeScenes"],
  blacklist: ["loading", "error", "success", "currentScene"],
};

// Root persist config
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: [], // Don't persist anything at root level
  blacklist: ["modal"], // Never persist modal state
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
