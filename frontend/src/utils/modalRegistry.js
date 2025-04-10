import React from "react";
import { MODAL_CONFIG } from "./config";
import { MODAL_TYPES } from "../constants/modalTypes";

// Import components statically instead of dynamically
import AlertModal from "../components/modals/AlertModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import FormModal from "../components/modals/FormModal";
import LoginModal from "../components/auth/LoginModal";
import SignupModal from "../components/auth/SignupModal";

// Create modal registry
const modalRegistry = new Map();

// Component lookup function
const getModalComponent = async (type) => {
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
    "music-delete"
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
        console.log("Loading UniverseModalComponent from consolidated components");
        const { UniverseModalComponent } = await import("../components/consolidated");
        component = UniverseModalComponent;
        break;
      case "SCENE_FORM":
        console.log("Loading SceneModalComponent from consolidated components");
        const { SceneModalComponent } = await import("../components/consolidated");
        component = SceneModalComponent;
        break;
      case "CHARACTER_FORM":
        console.log("Loading CharacterFormModalComponent from consolidated components");
        const { CharacterFormModalComponent } = await import("../components/consolidated");
        component = CharacterFormModalComponent;
        break;
      case "audio-generate":
        console.log("Loading AudioGenerationModalFinal component");
        const { AudioGenerationModalFinal } = await import("../components/consolidated");
        component = AudioGenerationModalFinal;
        break;
      case "audio-details":
        console.log("Loading AudioDetailsModalFinal component");
        const { AudioDetailsModalFinal } = await import("../components/consolidated");
        component = AudioDetailsModalFinal;
        break;
      case "music-create":
        console.log("Loading MusicModalComponent with generate mode");
        const { MusicModalComponent } = await import("../components/consolidated");
        component = MusicModalComponent;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "generate"
        };
        break;
      case "music-view":
        console.log("Loading MusicModalComponent with view mode");
        const { MusicModalComponent: MusicViewComponent } = await import("../components/consolidated");
        component = MusicViewComponent;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "view"
        };
        break;
      case "music-edit":
        console.log("Loading MusicModalComponent with edit mode");
        const { MusicModalComponent: MusicEditComponent } = await import("../components/consolidated");
        component = MusicEditComponent;
        // Set default props for this modal type
        component.defaultProps = {
          ...component.defaultProps,
          mode: "edit"
        };
        break;
      case "music-delete":
        console.log("Loading MusicModalComponent with delete mode");
        const { MusicModalComponent: MusicDeleteComponent } = await import("../components/consolidated");
        component = MusicDeleteComponent;
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