import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for better TypeScript support
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Store configuration
export * from './store';

// Slices
export * from './slices/authSlice';
export * from './slices/characterSlice';
export * from './slices/newModalSlice';
export * from './slices/noteSlice';
export * from './slices/scenesSlice';
export * from './slices/universeSlice';

// Actions from slices
export {
  clearError as clearAuthError,
  loginFailure,
  // Auth actions
  loginStart,
  loginSuccess,
  logoutFailure,
  logoutSuccess,
  setNetworkError,
  setOfflineMode,
  updateUser,
} from './slices/authSlice';

// Commenting out exports that may not exist - uncomment after implementing in slice files
/*
export {
  // Character actions
  setCharacters, setCurrentCharacter, addCharacter,
  updateCharacterAction as updateCharacter, deleteCharacterAction as deleteCharacter,
  setCharacterError, clearError, clearSuccess, clearCharacters, clearCurrentCharacter,
} from './slices/characterSlice';

export {
  // Note actions
  setNotes, setCurrentNote, addNote, updateNote, deleteNote, setNoteError,
} from './slices/noteSlice';

export {
  // Physics objects actions
  setPhysicsObjects, addPhysicsObject, updatePhysicsObject, deletePhysicsObject,
  setCurrentPhysicsObject, setPhysicsObjectsError,
} from './slices/physicsObjectsSlice';

export {
  // Physics parameters actions
  setPhysicsParameters, updatePhysicsParameters, setPhysicsParametersError,
} from './slices/physicsParametersSlice';

export {
  // Scene actions
  clearSceneError, clearSceneSuccess, resetSceneState,
  setError as setSceneError, setCurrentScene, addScene, addLocallyCreatedScene,
} from './slices/scenesSlice';

export {
  // Universe actions
  setUniverses, setCurrentUniverse, addUniverse,
  updateUniverse as updateUniverseAction, deleteUniverse as deleteUniverseAction, setUniverseError,
} from './slices/universeSlice';
*/

// Thunks
export * from './thunks/authThunks';
export * from './thunks/characterThunks';
export * from './thunks/noteThunks';
export * from './thunks/sceneThunks';
export * from './thunks/universeThunks';

// Selectors
export * from './selectors/universeSelectors';

// Re-export hooks for easy importing
export { useModalState, useModalTypeState } from '../hooks/useModalState';
