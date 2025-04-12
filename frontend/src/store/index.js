import { useDispatch, useSelector } from 'react-redux';

// Typed hooks for better TypeScript support
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Store configuration
export { default, persistor } from './store';

// Slices
export { default as authReducer } from './slices/authSlice';
export { default as characterReducer } from './slices/characterSlice';
export { default as modalReducer } from './slices/modalSlice';
export { default as noteReducer } from './slices/noteSlice';
export { default as physicsObjectsReducer } from './slices/physicsObjectsSlice';
export { default as physicsParametersReducer } from './slices/physicsParametersSlice';
export { default as scenesReducer } from './slices/scenesSlice';
export { default as universeReducer } from './slices/universeSlice';

// Actions from slices
export {
  // Auth actions
  loginStart, loginSuccess, loginFailure, logoutSuccess, logoutFailure, 
  updateUser, clearError as clearAuthError, setNetworkError, setOfflineMode,
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
  // Modal actions
  openModal as openModalAction, closeModal as closeModalAction, setModalData,
} from './slices/modalSlice';

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
export * from './thunks';

// Selectors
export * from './selectors/universeSelectors'; 