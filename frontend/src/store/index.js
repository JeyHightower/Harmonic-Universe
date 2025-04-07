// Store configuration
export { default as store } from './store';

// Slices
export { default as authReducer } from './slices/authSlice';
export { default as characterReducer } from './slices/characterSlice';
export { default as modalReducer } from './slices/modalSlice';
export { default as noteReducer } from './slices/noteSlice';
export { default as physicsObjectsReducer } from './slices/physicsObjectsSlice';
export { default as physicsParametersReducer } from './slices/physicsParametersSlice';
export { default as scenesReducer } from './slices/scenesSlice';
export { default as universeReducer } from './slices/universeSlice';

// Exports from auth slice
export {
  setUser,
  clearUser,
  setAuthError,
  clearAuthError,
  setLoading,
  clearLoading,
} from './slices/authSlice';

// Exports from character slice
export {
  setCharacters,
  setCurrentCharacter,
  addCharacter,
  updateCharacterAction as updateCharacter,
  deleteCharacterAction as deleteCharacter,
  setCharacterError,
  openModal,
  closeModal,
  clearError,
  clearSuccess,
  clearCharacters,
  clearCurrentCharacter,
} from './slices/characterSlice';

// Exports from modal slice
export {
  openModal as openModalAction,
  closeModal as closeModalAction,
  setModalData,
} from './slices/modalSlice';

// Exports from note slice
export {
  setNotes,
  setCurrentNote,
  addNote,
  updateNote,
  deleteNote,
  setNoteError,
} from './slices/noteSlice';

// Exports from physics objects slice
export {
  setPhysicsObjects,
  addPhysicsObject,
  updatePhysicsObject,
  deletePhysicsObject,
  setCurrentPhysicsObject,
  setPhysicsObjectsError,
} from './slices/physicsObjectsSlice';

// Exports from physics parameters slice
export {
  setPhysicsParameters,
  updatePhysicsParameters,
  setPhysicsParametersError,
} from './slices/physicsParametersSlice';

// Exports from scenes slice
export {
  clearSceneError,
  clearSceneSuccess,
  resetSceneState,
  setError as setSceneError,
  setCurrentScene,
  addScene,
  addLocallyCreatedScene,
} from './slices/scenesSlice';

// Exports from universe slice
export {
  setUniverses,
  setCurrentUniverse,
  addUniverse,
  updateUniverse as updateUniverseAction,
  deleteUniverse as deleteUniverseAction,
  setUniverseError,
} from './slices/universeSlice';

// Thunks
export * from './thunks';

// Selectors
export * from './selectors/universeSelectors'; 