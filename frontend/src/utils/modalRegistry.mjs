import React, { lazy } from 'react';
import { MODAL_TYPES } from "../constants/modalTypes";

// Import components statically instead of dynamically
import { AlertModal, FormModal } from "../components/modals/index.mjs";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import LoginModal from "../features/auth/modals/LoginModal";
import SignupModal from "../features/auth/modals/SignupModal";
import { PhysicsParametersModal, PhysicsConstraintModal } from "../features/physics";
import { MODAL_CONFIG } from "./config";

// Create modal registry
const modalRegistry = new Map();

// Component lookup function
export const getModalComponent = async (type) => {
  if (!type) {
    console.error("Modal type is required");
    return null;
  }

  // Create a combined list of valid types
  const validTypes = [
    ...Object.values(MODAL_CONFIG.TYPES),
    MODAL_TYPES.LOGIN,
    MODAL_TYPES.SIGNUP,
    MODAL_TYPES.UNIVERSE_CREATE,
    "SCENE_FORM",
    "CHARACTER_FORM",
    "audio-generate",
    "audio-details",
    "music-create",
    "music-view",
    "music-edit",
    "music-delete",
    "PHYSICS_OBJECT",
    "PHYSICS_PARAMETERS",
    "PHYSICS_CONSTRAINT"
  ];

  if (!validTypes.includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  try {
    let component;
    switch (type) {
      case "ALERT":
      case MODAL_TYPES.ALERT:
        component = AlertModal;
        break;
      case "CONFIRMATION":
      case MODAL_TYPES.CONFIRMATION:
        component = ConfirmationModal;
        break;
      case "FORM":
      case MODAL_TYPES.FORM:
        component = FormModal;
        break;
      case "LOGIN":
      case MODAL_TYPES.LOGIN:
        component = LoginModal;
        break;
      case "SIGNUP":
      case MODAL_TYPES.SIGNUP:
        component = SignupModal;
        break;
      case "universe-create":
      case MODAL_TYPES.UNIVERSE_CREATE:
        console.log("Loading UniverseModal");
        try {
          // Fall back to FormModal if import fails
          component = FormModal;
        } catch (e) {
          console.warn("Fallback to default UniverseModal", e);
          component = FormModal;
        }
        break;
      case "SCENE_FORM":
        console.log("Loading SceneModal");
        // Fall back to FormModal
        component = FormModal;
        break;
      case "CHARACTER_FORM":
        console.log("Loading CharacterModal");
        // Fall back to FormModal
        component = FormModal;
        break;
      case "PHYSICS_OBJECT":
        console.log("Loading PhysicsObjectModal");
        // Fall back to FormModal 
        component = FormModal;
        break;
      case "PHYSICS_PARAMETERS":
      case MODAL_TYPES.PHYSICS_PARAMETERS:
        console.log("Loading PhysicsParametersModal");
        component = PhysicsParametersModal;
        break;
      case "PHYSICS_CONSTRAINT":
      case "physics-constraint":
        console.log("Loading PhysicsConstraintModal");
        component = PhysicsConstraintModal;
        break;
      case "audio-generate":
        console.log("Loading AudioGenerationModalFinal component");
        // Fall back to FormModal
        component = FormModal;
        break;
      case "audio-details":
        console.log("Loading AudioDetailsModalFinal component");
        // Fall back to FormModal
        component = FormModal;
        break;
      case "music-create":
        console.log("Loading MusicModalComponent with generate mode");
        // Fall back to FormModal
        component = FormModal;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "generate"
        };
        break;
      case "music-view":
        console.log("Loading MusicModalComponent with view mode");
        // Fall back to FormModal
        component = FormModal;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "view"
        };
        break;
      case "music-edit":
        console.log("Loading MusicModalComponent with edit mode");
        // Fall back to FormModal
        component = FormModal;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "edit"
        };
        break;
      case "music-delete":
        console.log("Loading MusicModalComponent with delete mode");
        // Fall back to FormModal
        component = FormModal;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "delete"
        };
        break;
      default:
        console.error(`No modal component found for type: ${type}`);
        return null;
    }
    return component;
  } catch (error) {
    console.error(`Error loading modal component: ${error}`);
    return null;
  }
};

/**
 * Check if a modal type is valid
 * @param {string} type - The modal type to validate
 * @returns {boolean} Whether the type is valid
 */
export const isValidModalType = (type) => {
  // Check both MODAL_CONFIG.TYPES and MODAL_TYPES
  return Object.values(MODAL_CONFIG.TYPES).includes(type) ||
    Object.values(MODAL_TYPES).includes(type);
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
  };
};

/**
 * Register a new modal component
 * @param {string} type - The modal type
 * @param {React.Component} component - The modal component
 * @returns {boolean} Whether registration was successful
 */
export const registerModalComponent = (type, component) => {
  if (!type || !component) {
    console.error("Modal type and component are required");
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
    console.error("Modal type is required");
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
      props: mergedProps
    };
  } catch (error) {
    console.error(`Error registering modal type ${type}:`, error);
    return null;
  }
};

export default {
  getModalComponent,
  isValidModalType,
  getDefaultModalProps,
  registerModalComponent,
  unregisterModalComponent,
  getRegisteredModalTypes,
  registerModalTypes
};