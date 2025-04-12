/**
 * Character Components
 * 
 * This file exports all character-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Component exports
export { default as CharacterCard } from './components/CharacterCard';
export { default as CharacterList } from './components/CharacterList';
export { default as CharacterSelector } from './components/CharacterSelector';

// Modal exports
export { default as CharacterModal } from './modals/CharacterModal';

// Page exports
export { default as CharacterDetail } from './pages/CharacterDetail';
export { default as CharacterForm } from './pages/CharacterForm';
export { default as CharacterManagement } from './pages/CharacterManagement';
export { default as CharactersPage } from './pages/CharactersPage';

// For backward compatibility
export { default as CharacterModalHandler } from './modals/CharacterModal'; 