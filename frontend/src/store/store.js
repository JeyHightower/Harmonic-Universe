import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './slices/audioSlice';
import physicsReducer from './slices/physicsSlice';
import universeReducer from './slices/universeSlice';
import visualizationReducer from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    audio: audioReducer,
    physics: physicsReducer,
    universe: universeReducer,
    visualization: visualizationReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
