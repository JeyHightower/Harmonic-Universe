import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import modalReducer from "./slices/modalSlice";
import physicsObjectsReducer from "./slices/physicsObjectsSlice";
import universeReducer from "./slices/universeSlice";
import scenesReducer from "./slices/scenesSlice";
import physicsParametersReducer from "./slices/physicsParametersSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
    physicsObjects: physicsObjectsReducer,
    universe: universeReducer,
    scenes: scenesReducer,
    physicsParameters: physicsParametersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["physicsObjects/simulate"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.file", "payload.timestamp"],
      },
    }),
});

export default store;
