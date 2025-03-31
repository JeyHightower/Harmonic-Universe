import React from "react";
import { MODAL_CONFIG } from "./config";

// Create modal registry
const modalRegistry = new Map();

// Dynamic import function for modal components
const getModalComponent = async (type) => {
  if (!type) {
    console.error("Modal type is required");
    return null;
  }

  if (!Object.values(MODAL_CONFIG.TYPES).includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  try {
    let component;
    switch (type) {
      case "ALERT":
        component = (await import("../components/modals/AlertModal")).default;
        break;
      case "CONFIRMATION":
        component = (await import("../components/modals/ConfirmationModal")).default;
        break;
      case "FORM":
        component = (await import("../components/modals/FormModal")).default;
        break;
      case "LOGIN":
        component = (await import("../components/auth/LoginModal")).default;
        break;
      case "SIGNUP":
        component = (await import("../components/auth/SignupModal")).default;
        break;
      case "UNIVERSE_CREATE":
        component = (await import("../components/modals/UniverseCreateModal")).default;
        break;
      default:
        console.error(`No modal component found for type: ${type}`);
        return null;
    }
    return component;
  } catch (error) {
    console.error(`Error loading modal component for type ${type}:`, error);
    return null;
  }
};

/**
 * Check if a modal type is valid
 * @param {string} type - The modal type to validate
 * @returns {boolean} Whether the type is valid
 */
export const isValidModalType = (type) => {
  return Object.values(MODAL_CONFIG.TYPES).includes(type);
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

export { getModalComponent };
