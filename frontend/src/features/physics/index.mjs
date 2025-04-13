/**
 * Physics Components
 * 
 * This file exports all physics-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Component exports
export { default as PhysicsPanel } from './components/PhysicsPanel';
export { default as PhysicsObjectsManager } from './components/PhysicsObjectsManager';
export { default as PhysicsObjectForm } from './components/PhysicsObjectForm';
export { default as PhysicsObjectsList } from './components/PhysicsObjectsList';
export { default as PhysicsParametersManager } from './components/PhysicsParametersManager';

// Modal exports
export { default as PhysicsParametersModal } from './modals/PhysicsParametersModal';
export { default as PhysicsSettingsModal } from './modals/PhysicsSettingsModal';
export { default as PhysicsConstraintModal } from './modals/PhysicsConstraintModal';
export { default as PhysicsObjectModal } from './modals/PhysicsObjectModal';

// Page exports
export { default as PhysicsEditor } from './pages/PhysicsEditor';
export { default as PhysicsPage } from './pages/PhysicsPage'; 