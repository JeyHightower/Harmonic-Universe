import React from 'react';
import { MODAL_TYPES } from '../constants/modalTypes';

// Import components statically instead of dynamically
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { AlertModal, FormModal } from '../components/modals/index.mjs';
import TestModal from '../components/modals/TestModal';
import LoginModal from '../features/auth/modals/LoginModal';
import SignupModal from '../features/auth/modals/SignupModal';
import { PhysicsConstraintModal, PhysicsParametersModal } from '../features/physics';
import { SceneModal } from '../features/scene';
import UniverseModal from '../features/universe/modals/UniverseModal';
import { MODAL_CONFIG } from './config';

// Create modal registry
const modalRegistry = new Map();

// Define which modals have their own built-in modal wrappers
const builtInModalTypes = [
  'UNIVERSE_CREATE',
  'universe-create',
  'LOGIN',
  'SIGNUP',
  'PHYSICS_PARAMETERS',
  'PHYSICS_CONSTRAINT',
];

// Component lookup function
export const getModalComponent = async (type) => {
  if (!type) {
    console.error('Modal type is required');
    return null;
  }

  // Create a combined list of valid types
  const validTypes = [
    ...Object.values(MODAL_CONFIG.TYPES),
    MODAL_TYPES.LOGIN,
    MODAL_TYPES.SIGNUP,
    MODAL_TYPES.UNIVERSE_CREATE,
    'SCENE_FORM',
    'CHARACTER_FORM',
    'audio-generate',
    'audio-details',
    'music-create',
    'music-view',
    'music-edit',
    'music-delete',
    'PHYSICS_OBJECT',
    'PHYSICS_PARAMETERS',
    'PHYSICS_CONSTRAINT',
    'TEST_MODAL',
  ];

  if (!validTypes.includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  try {
    let component;
    let hasBuiltInModal = builtInModalTypes.includes(type);

    switch (type) {
      case 'ALERT':
      case MODAL_TYPES.ALERT:
        component = AlertModal;
        break;
      case 'CONFIRMATION':
      case MODAL_TYPES.CONFIRMATION:
        component = ConfirmationModal;
        break;
      case 'FORM':
      case MODAL_TYPES.FORM:
        component = FormModal;
        break;
      case 'LOGIN':
      case MODAL_TYPES.LOGIN:
        component = LoginModal;
        hasBuiltInModal = true;
        break;
      case 'SIGNUP':
      case MODAL_TYPES.SIGNUP:
        component = SignupModal;
        hasBuiltInModal = true;
        break;
      case 'universe-create':
      case MODAL_TYPES.UNIVERSE_CREATE:
        console.log('Loading UniverseModal');
        component = UniverseModal;
        hasBuiltInModal = true;
        break;
      case 'TEST_MODAL':
        console.log('Loading TestModal');
        component = TestModal;
        break;
      case 'SCENE_FORM':
        console.log('Loading SceneModal');
        // Use the imported SceneModal component
        component = SceneModal;
        break;
      case 'CHARACTER_FORM':
        console.log('Loading CharacterModal');
        try {
          const CharacterModule = await import('../features/character/modals/CharacterModal.jsx');
          component = CharacterModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for CharacterModal', e);
          component = FormModal;
        }
        break;
      case 'PHYSICS_OBJECT':
        console.log('Loading PhysicsObjectModal');
        try {
          const PhysicsObjectModule = await import('../features/physics/modals/PhysicsObjectModal.jsx');
          component = PhysicsObjectModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for PhysicsObjectModal', e);
          component = FormModal;
        }
        break;
      case 'PHYSICS_PARAMETERS':
      case MODAL_TYPES.PHYSICS_PARAMETERS:
        console.log('Loading PhysicsParametersModal');
        component = PhysicsParametersModal;
        hasBuiltInModal = true;
        break;
      case 'PHYSICS_CONSTRAINT':
      case 'physics-constraint':
        console.log('Loading PhysicsConstraintModal');
        component = PhysicsConstraintModal;
        hasBuiltInModal = true;
        break;
      case 'audio-generate':
        console.log('Loading AudioGenerationModalFinal component');
        try {
          const AudioGenerateModule = await import('../features/music/modals/AudioGenerationModal.jsx');
          component = AudioGenerateModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for AudioGenerationModal', e);
          component = FormModal;
        }
        break;
      case 'audio-details':
        console.log('Loading AudioDetailsModalFinal component');
        try {
          const AudioDetailsModule = await import('../features/music/modals/AudioDetailsModal.jsx');
          component = AudioDetailsModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for AudioDetailsModal', e);
          component = FormModal;
        }
        break;
      case 'music-create':
      case 'music-view':
      case 'music-edit':
      case 'music-delete':
        console.log(`Loading MusicModalComponent with ${type} mode`);
        try {
          const MusicModalModule = await import('../features/music/modals/MusicModal.jsx');
          component = MusicModalModule.default;
          // Set default props for this modal type
          const mode = type.replace('music-', '');
          component.defaultProps = {
            ...component.defaultProps,
            mode,
            title: getModalDisplayName(type)
          };
        } catch (e) {
          console.warn(`Fallback to FormModal for MusicModal (${type})`, e);
          component = FormModal;
        }
        break;
      default:
        console.error(`No modal component found for type: ${type}`);
        return null;
    }

    // Set a flag on the component to indicate if it has a built-in modal
    if (component) {
      component.__hasBuiltInModal = hasBuiltInModal;
    }

    return component;
  } catch (error) {
    console.error(`Error loading modal component: ${error}`);
    return null;
  }
};

/**
 * Get the display name for a modal type
 * @param {string} type - The modal type
 * @returns {string} The display name
 */
export const getModalDisplayName = (type) => {
  const displayNames = {
    [MODAL_TYPES.ALERT]: "Alert",
    [MODAL_TYPES.CONFIRMATION]: "Confirmation",
    [MODAL_TYPES.FORM]: "Form",
    [MODAL_TYPES.LOGIN]: "Login",
    [MODAL_TYPES.SIGNUP]: "Sign Up",
    [MODAL_TYPES.UNIVERSE_CREATE]: "Create Universe",
    "universe-create": "Create Universe",
    [MODAL_TYPES.SCENE_FORM]: "Scene",
    "SCENE_FORM": "Scene",
    [MODAL_TYPES.CHARACTER_FORM]: "Character",
    "CHARACTER_FORM": "Character",
    [MODAL_TYPES.PHYSICS_OBJECT]: "Physics Object",
    "PHYSICS_OBJECT": "Physics Object",
    [MODAL_TYPES.PHYSICS_PARAMETERS]: "Physics Parameters",
    "PHYSICS_PARAMETERS": "Physics Parameters",
    [MODAL_TYPES.PHYSICS_CONSTRAINT]: "Physics Constraint",
    "PHYSICS_CONSTRAINT": "Physics Constraint",
    "physics-constraint": "Physics Constraint",
    [MODAL_TYPES.MUSIC_CREATE]: "Create Music",
    "music-create": "Create Music",
    [MODAL_TYPES.MUSIC_VIEW]: "View Music",
    "music-view": "View Music",
    [MODAL_TYPES.MUSIC_EDIT]: "Edit Music",
    "music-edit": "Edit Music",
    [MODAL_TYPES.MUSIC_DELETE]: "Delete Music",
    "music-delete": "Delete Music",
    [MODAL_TYPES.MUSIC_GENERATE]: "Generate Music",
    "audio-generate": "Generate Audio",
    [MODAL_TYPES.MUSIC_DETAILS]: "Music Details",
    "audio-details": "Audio Details",
    [MODAL_TYPES.TEST_MODAL]: "Test Modal",
    "TEST_MODAL": "Test Modal",
  };

  return displayNames[type] || type;
};

/**
 * Check if a modal type is valid
 * @param {string} type - The modal type to validate
 * @returns {boolean} Whether the type is valid
 */
export const isValidModalType = (type) => {
  // Check both MODAL_CONFIG.TYPES and MODAL_TYPES
  return (
    Object.values(MODAL_CONFIG.TYPES).includes(type) || Object.values(MODAL_TYPES).includes(type)
  );
};

/**
 * Get default props for a modal type
 * @param {string} type - The modal type
 * @returns {Object} Default props for the modal
 */
export const getDefaultModalProps = (type) => {
  if (!isValidModalType(type)) {
    return null;
  }

  return {
    size: MODAL_CONFIG.SIZES.MEDIUM,
    position: MODAL_CONFIG.POSITIONS.CENTER,
    animation: MODAL_CONFIG.ANIMATIONS.FADE,
    draggable: false,
    closeOnEscape: true,
    closeOnBackdrop: true,
    preventBodyScroll: true,
    showCloseButton: true,
    title: getModalDisplayName(type),
  };
};

/**
 * Register a new modal component
 * @param {string} type - The modal type
 * @param {React.Component} component - The modal component
 * @param {boolean} hasBuiltInModal - Whether the component has its own modal implementation
 * @returns {boolean} Whether registration was successful
 */
export const registerModalComponent = (type, component, hasBuiltInModal = false) => {
  if (!type || !component) {
    console.error('Modal type and component are required');
    return false;
  }

  if (!isValidModalType(type)) {
    console.error(`Invalid modal type: ${type}`);
    return false;
  }

  if (modalRegistry.has(type)) {
    console.warn(`Modal type ${type} is already registered`);
    return false;
  }

  // Set the flag on the component
  component.__hasBuiltInModal = hasBuiltInModal;

  modalRegistry.set(type, component);
  return true;
};

/**
 * Unregister a modal component
 * @param {string} type - The modal type to unregister
 * @returns {boolean} Whether unregistration was successful
 */
export const unregisterModalComponent = (type) => {
  if (!type) {
    console.error('Modal type is required');
    return false;
  }

  if (!isValidModalType(type)) {
    console.error(`Invalid modal type: ${type}`);
    return false;
  }

  if (!modalRegistry.has(type)) {
    console.warn(`Modal type ${type} is not registered`);
    return false;
  }

  modalRegistry.delete(type);
  return true;
};

/**
 * Get all registered modal types
 * @returns {string[]} Array of registered modal types
 */
export const getRegisteredModalTypes = () => {
  return Array.from(modalRegistry.keys());
};

export const registerModalTypes = async (type, props) => {
  if (!type) return null;

  try {
    const component = await getModalComponent(type);
    if (!component) {
      console.error(`Failed to load component for modal type: ${type}`);
      return null;
    }

    // Merge with default props if available
    const defaultProps = getDefaultModalProps(type);
    const mergedProps = defaultProps ? { ...defaultProps, ...props } : props;

    // For music modes, ensure the mode is set correctly
    if (type.startsWith('music-') || type.startsWith('audio-')) {
      if (type === 'music-create' || type === 'audio-generate') {
        mergedProps.mode = 'generate';
      } else if (type === 'music-view' || type === 'audio-details') {
        mergedProps.mode = 'view';
      } else if (type === 'music-edit') {
        mergedProps.mode = 'edit';
      } else if (type === 'music-delete') {
        mergedProps.mode = 'delete';
      }
    }

    return {
      component,
      props: mergedProps,
    };
  } catch (error) {
    console.error(`Error registering modal type ${type}:`, error);
    return null;
  }
};

// Create an object with all the functions to export
const modalRegistryExports = {
  getModalComponent,
  isValidModalType,
  getDefaultModalProps,
  registerModalComponent,
  unregisterModalComponent,
  getModalDisplayName,
};

export default modalRegistryExports;
