/**
 * Scene Components
 * 
 * This file exports all scene-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Component exports
export { default as SceneCard } from './components/SceneCard.jsx';
export { default as SceneCardSimple } from './components/SceneCardSimple.jsx';
export { default as SceneViewer } from './components/SceneViewer.jsx';

// Modal exports
export { default as SceneModal } from './modals/SceneModal.jsx';
export { default as SceneDeleteConfirmation } from './modals/SceneDeleteConfirmation.jsx';

// Page exports
export { default as SceneDetail } from './pages/SceneDetail.jsx';
export { default as SceneEditPage } from './pages/SceneEditPage.jsx';
export { default as SceneForm } from './pages/SceneForm.jsx';
export { default as ScenesPage } from './pages/ScenesPage.jsx';

// For backward compatibility
export { default as SceneModalHandler } from './modals/SceneModal.jsx'; 