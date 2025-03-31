import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import modalReducer from "./slices/modalSlice";
import physicsObjectsReducer from "./slices/physicsObjectsSlice";
import universeReducer from "./slices/universeSlice";
import scenesReducer from "./slices/scenesSlice";
import physicsParametersReducer from "./slices/physicsParametersSlice";

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

const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    modal: modalReducer,
    physicsObjects: physicsObjectsReducer,
    universe: persistReducer(universePersistConfig, universeReducer),
    scenes: persistReducer(scenesPersistConfig, scenesReducer),
    physicsParameters: physicsParametersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "physicsObjects/simulate",
          "persist/PERSIST",
          "persist/REHYDRATE",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.file", "payload.timestamp"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
