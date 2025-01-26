import { configureStore } from "@reduxjs/toolkit";
import audioReducer from "./slices/audioSlice";
import authReducer from "./slices/authSlice";
import physicsReducer from "./slices/physicsSlice";
import universeReducer from "./slices/universeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    universe: universeReducer,
    audio: audioReducer,
    physics: physicsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
