import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { audioReducer } from './slices/audioSlice';
import { authReducer } from './slices/authSlice';
import { physicsReducer } from './slices/physicsSlice';
import { projectsReducer } from './slices/projectsSlice';
import { universeReducer } from './slices/universeSlice';
import { visualizationReducer } from './slices/visualizationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    audio: audioReducer,
    visualization: visualizationReducer,
    physics: physicsReducer,
    universe: universeReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'audio/setAudioBuffer',
          'physics/updateObjectTransform',
          'universe/updateHarmonyParameters',
          'visualization/updateData',
        ],
        ignoredPaths: [
          'audio.audioBuffers',
          'physics.objects',
          'universe.harmony',
          'visualization.data',
        ],
      },
    }),
});

export 
export 

export const useAppDispatch = () => useDispatch();
export const useAppSelector: TypedUseSelectorHook = useSelector;
