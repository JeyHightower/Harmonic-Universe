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
import sceneReducer from "./slices/sceneSlice";
import characterReducer from "./slices/characterSlice";
import noteReducer from "./slices/noteSlice";

// Configure persistence for reducers that need to persist
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated"], // Only persist these fields
};

const universePersistConfig = {
  key: "universe",
  storage,
  whitelist: ["universes", "currentUniverse"], // Only persist these fields
};

const scenesPersistConfig = {
  key: "scenes",
  storage,
  whitelist: ["scenes"], // Only persist the scenes array
};

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth", "universes", "scenes", "characters", "notes"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  universes: universeReducer,
  scenes: sceneReducer,
  characters: characterReducer,
  notes: noteReducer,
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
});

export const persistor = persistStore(store);
export default store;
