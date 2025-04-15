/**
 * Scene Components
 * 
 * This file exports all scene-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Component exports
export { default as SceneCard } from './components/SceneCard';
export { default as SceneCardSimple } from './components/SceneCardSimple';
export { default as SceneViewer } from './components/SceneViewer';
export { default as ScenesExample } from './components/ScenesExample';

// Modal exports
export { default as SceneModal } from './modals/SceneModal';
export { default as SceneDeleteConfirmation } from './modals/SceneDeleteConfirmation';

// Page exports
export { default as SceneDetail } from './pages/SceneDetail';
export { default as SceneEditPage } from './pages/SceneEditPage';
export { default as SceneForm } from './pages/SceneForm';
export { default as SceneList } from './pages/SceneList';
export { default as ScenesPage } from './pages/ScenesPage';

// For backward compatibility
export { default as SceneModalHandler } from './modals/SceneModal'; 