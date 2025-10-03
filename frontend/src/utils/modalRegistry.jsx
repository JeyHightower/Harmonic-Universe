import React from 'react';
import { MODAL_TYPES } from '../constants/modalTypes';
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
  'viewScene',
  'editScene',
];

// Initialize registry with statically imported components
async function initializeRegistry() {
  try {
    // Import components dynamically to avoid circular dependencies
    const { AlertModal, FormModal } = await import(
      /* @vite-ignore */ '../components/modals/index.mjs'
    );
    const ConfirmationModalModule = await import(
      /* @vite-ignore */ '../components/modals/ConfirmationModal'
    );
    const ConfirmationModal = ConfirmationModalModule.default;
    const LoginModalModule = await import(/* @vite-ignore */ '../features/auth/modals/LoginModal');
    const LoginModal = LoginModalModule.default;
    const SignupModalModule = await import(
      /* @vite-ignore */ '../features/auth/modals/SignupModal'
    );
    const SignupModal = SignupModalModule.default;
    const { PhysicsConstraintModal, PhysicsParametersModal } = await import(
      /* @vite-ignore */ '../features/physics'
    );
    const SceneModalModule = await import(/* @vite-ignore */ '../features/scene');
    const SceneModal = SceneModalModule.default;
    const UniverseModalModule = await import(
      /* @vite-ignore */ '../features/universe/modals/UniverseModal'
    );
    const UniverseModal = UniverseModalModule.default;
    const CharacterModule = await import(
      /* @vite-ignore */ '../features/character/modals/CharacterModal.jsx'
    );
    const PhysicsObjectModule = await import(
      /* @vite-ignore */ '../features/physics/modals/PhysicsObjectModal.jsx'
    );
    const AudioGenerateModule = await import(
      /* @vite-ignore */ '../features/music/modals/AudioGenerationModal.jsx'
    );
    const AudioDetailsModule = await import(
      /* @vite-ignore */ '../features/music/modals/AudioDetailsModal.jsx'
    );
    const MusicModalModule = await import(
      /* @vite-ignore */ '../features/music/modals/MusicModal.jsx'
    );

    // Register static components
    modalRegistry.set('ALERT', { component: AlertModal, hasBuiltInModal: false });
    modalRegistry.set(MODAL_TYPES.ALERT, { component: AlertModal, hasBuiltInModal: false });

    modalRegistry.set('CONFIRMATION', { component: ConfirmationModal, hasBuiltInModal: false });
    modalRegistry.set(MODAL_TYPES.CONFIRMATION, {
      component: ConfirmationModal,
      hasBuiltInModal: false,
    });

    modalRegistry.set('FORM', { component: FormModal, hasBuiltInModal: false });
    modalRegistry.set(MODAL_TYPES.FORM, { component: FormModal, hasBuiltInModal: false });

    modalRegistry.set('LOGIN', { component: LoginModal, hasBuiltInModal: true });
    modalRegistry.set(MODAL_TYPES.LOGIN, { component: LoginModal, hasBuiltInModal: true });

    modalRegistry.set('SIGNUP', { component: SignupModal, hasBuiltInModal: true });
    modalRegistry.set(MODAL_TYPES.SIGNUP, { component: SignupModal, hasBuiltInModal: true });

    modalRegistry.set('universe-create', { component: UniverseModal, hasBuiltInModal: true });
    modalRegistry.set(MODAL_TYPES.UNIVERSE_CREATE, {
      component: UniverseModal,
      hasBuiltInModal: true,
    });

    modalRegistry.set('SCENE_FORM', { component: SceneModal, hasBuiltInModal: false });

    modalRegistry.set('viewScene', { component: SceneModal, hasBuiltInModal: true });
    modalRegistry.set('editScene', { component: SceneModal, hasBuiltInModal: true });

    modalRegistry.set('PHYSICS_PARAMETERS', {
      component: PhysicsParametersModal,
      hasBuiltInModal: true,
    });
    modalRegistry.set(MODAL_TYPES.PHYSICS_PARAMETERS, {
      component: PhysicsParametersModal,
      hasBuiltInModal: true,
    });

    modalRegistry.set('PHYSICS_CONSTRAINT', {
      component: PhysicsConstraintModal,
      hasBuiltInModal: true,
    });
    modalRegistry.set('physics-constraint', {
      component: PhysicsConstraintModal,
      hasBuiltInModal: true,
    });

    console.log(
      'Modal registry initialized with static components:',
      Array.from(modalRegistry.keys()).join(', ')
    );
  } catch (error) {
    console.error('Error initializing modal registry:', error);
  }
}

// Initialize the registry when this module loads
initializeRegistry();

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
    MODAL_TYPES.EDIT_SCENE,
    'SCENE_FORM',
    'CHARACTER_FORM',
    'audio-generate',
    'audio-details',
    'music-create',
    'music-view',
    'music-edit',
    'music-delete',
    'viewScene',
    'editScene',
    'PHYSICS_OBJECT',
    'PHYSICS_PARAMETERS',
    'PHYSICS_CONSTRAINT',
  ];

  if (!validTypes.includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  try {
    // First check if we have this component in the registry
    if (modalRegistry.has(type)) {
      console.log(`Found ${type} in registry`);
      return modalRegistry.get(type).component;
    }

    // If not in registry, try to load it dynamically
    let component;
    let hasBuiltInModal = builtInModalTypes.includes(type);

    switch (type) {
      case 'CHARACTER_FORM':
        console.log('Loading CharacterModal');
        try {
          component = CharacterModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for CharacterModal', e);
          component = FormModal;
        }
        break;
      case 'PHYSICS_OBJECT':
        console.log('Loading PhysicsObjectModal');
        try {
          component = PhysicsObjectModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for PhysicsObjectModal', e);
          component = FormModal;
        }
        break;
      case 'audio-generate':
        console.log('Loading AudioGenerationModalFinal component');
        try {
          component = AudioGenerateModule.default;
        } catch (e) {
          console.warn('Fallback to FormModal for AudioGenerationModal', e);
          component = FormModal;
        }
        break;
      case 'audio-details':
        console.log('Loading AudioDetailsModalFinal component');
        try {
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
          component = MusicModalModule.default;
          // Set default props for this modal type
          const mode = type.replace('music-', '');
          component.defaultProps = {
            ...component.defaultProps,
            mode,
            title: getModalDisplayName(type),
          };
        } catch (e) {
          console.warn(`Fallback to FormModal for MusicModal (${type})`, e);
          component = FormModal;
        }
        break;
      case 'viewScene':
      case 'editScene':
        console.log(`Loading SceneModal for ${type}`);
        try {
          const SceneModalModule = await import(/* @vite-ignore */ '../features/scene');
          component = SceneModalModule.default;
        } catch (e) {
          console.warn(`Fallback to FormModal for SceneModal (${type})`, e);
          component = FormModal;
        }
        break;
      default:
        console.error(`No modal component found for type: ${type}`);
        return null;
    }

    // If we loaded a component, add it to the registry for future lookups
    if (component) {
      component.__hasBuiltInModal = hasBuiltInModal;
      registerModalComponent(type, component, hasBuiltInModal);
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
    [MODAL_TYPES.ALERT]: 'Alert',
    [MODAL_TYPES.CONFIRMATION]: 'Confirmation',
    [MODAL_TYPES.FORM]: 'Form',
    [MODAL_TYPES.LOGIN]: 'Login',
    [MODAL_TYPES.SIGNUP]: 'Sign Up',
    [MODAL_TYPES.UNIVERSE_CREATE]: 'Create Universe',
    'universe-create': 'Create Universe',
    [MODAL_TYPES.SCENE_FORM]: 'Scene',
    SCENE_FORM: 'Scene',
    [MODAL_TYPES.EDIT_SCENE]: 'editScene',
    EditScene: 'Scene',
    [MODAL_TYPES.CHARACTER_FORM]: 'Character',
    CHARACTER_FORM: 'Character',
    [MODAL_TYPES.PHYSICS_OBJECT]: 'Physics Object',
    PHYSICS_OBJECT: 'Physics Object',
    [MODAL_TYPES.PHYSICS_PARAMETERS]: 'Physics Parameters',
    PHYSICS_PARAMETERS: 'Physics Parameters',
    [MODAL_TYPES.PHYSICS_CONSTRAINT]: 'Physics Constraint',
    PHYSICS_CONSTRAINT: 'Physics Constraint',
    'physics-constraint': 'Physics Constraint',
    [MODAL_TYPES.MUSIC_CREATE]: 'Create Music',
    'music-create': 'Create Music',
    [MODAL_TYPES.MUSIC_VIEW]: 'View Music',
    'music-view': 'View Music',
    [MODAL_TYPES.MUSIC_EDIT]: 'Edit Music',
    'music-edit': 'Edit Music',
    [MODAL_TYPES.MUSIC_DELETE]: 'Delete Music',
    'music-delete': 'Delete Music',
    [MODAL_TYPES.MUSIC_GENERATE]: 'Generate Music',
    'audio-generate': 'Generate Audio',
    [MODAL_TYPES.MUSIC_DETAILS]: 'Music Details',
    'audio-details': 'Audio Details',
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

  modalRegistry.set(type, { component, hasBuiltInModal });
  console.log(`Registered modal component for type: ${type}`);
  return true;
};

/**
 * Helper function to register an asynchronously loaded component
 * @param {string} type - The modal type
 * @param {string} importPath - Path to the component for dynamic import
 * @param {boolean} hasBuiltInModal - Whether the component has its own modal implementation
 * @returns {Promise<boolean>} Whether registration was successful
 */
export const registerAsyncModalComponent = async (type, importPath, hasBuiltInModal = false) => {
  try {
    if (!type || !importPath) {
      console.error('Modal type and import path are required');
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

    // Dynamically import the component
    const componentModule = await import(/* @vite-ignore */ importPath);
    const component = componentModule.default;

    if (!component) {
      console.error(`Failed to load component at ${importPath}`);
      return false;
    }

    // Register the component
    return registerModalComponent(type, component, hasBuiltInModal);
  } catch (error) {
    console.error(`Error registering async component for type ${type}:`, error);
    return false;
  }
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

// Component synchronous lookup function
export const getModalComponentSync = (type) => {
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
    'SceneModal',
    'editScene',
    'viewScene',
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
  ];

  if (!validTypes.includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  try {
    // Check if this type exists in the registry
    if (modalRegistry.has(type)) {
      const registryEntry = modalRegistry.get(type);
      return registryEntry.component;
    }

    // For dynamically loaded components, we return null
    // and defer to the async version, which will display a loading indicator
    return null;
  } catch (error) {
    console.error(`Error loading modal component: ${error}`);
    return null;
  }
};

// Create an object with all the functions to export
const modalRegistryExports = {
  getModalComponent,
  getModalComponentSync,
  isValidModalType,
  getDefaultModalProps,
  registerModalComponent,
  registerAsyncModalComponent,
  unregisterModalComponent,
  getModalDisplayName,
};

export default modalRegistryExports;
