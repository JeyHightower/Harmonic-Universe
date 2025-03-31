import React from "react";
import { MODAL_TYPES } from "../constants/modalTypes";
import { MODAL_CONFIG } from "./config";
import AlertModal from "../components/modals/AlertModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import FormModal from "../components/modals/FormModal";
import LoginModal from "../components/auth/LoginModal";
import SignupModal from "../components/auth/SignupModal";
import DemoLogin from "../components/auth/DemoLogin";

// Create modal registry
const modalRegistry = new Map();

// Register modal components
modalRegistry.set(MODAL_TYPES.ALERT, AlertModal);
modalRegistry.set(MODAL_TYPES.CONFIRMATION, ConfirmationModal);
modalRegistry.set(MODAL_TYPES.FORM, FormModal);
modalRegistry.set(MODAL_TYPES.LOGIN, LoginModal);
modalRegistry.set(MODAL_TYPES.SIGNUP, SignupModal);

/**
 * Get a modal component by type
 * @param {string} type - The modal type
 * @returns {React.Component} The modal component or null if not found
 */
export const getModalComponent = (type) => {
  if (!type) {
    console.error("Modal type is required");
    return null;
  }

  if (!Object.values(MODAL_TYPES).includes(type)) {
    console.error(`Invalid modal type: ${type}`);
    return null;
  }

  const component = modalRegistry.get(type);
  if (!component) {
    console.error(`No modal component found for type: ${type}`);
    return null;
  }

  return component;
};

/**
 * Check if a modal type is valid
 * @param {string} type - The modal type to validate
 * @returns {boolean} Whether the type is valid
 */
export const isValidModalType = (type) => {
  return Object.values(MODAL_TYPES).includes(type);
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

  const component = modalRegistry.get(type);
  if (!component) {
    return null;
  }

  return {
    size: component.defaultProps?.size || MODAL_CONFIG.SIZES.MEDIUM,
    position: component.defaultProps?.position || MODAL_CONFIG.POSITIONS.CENTER,
    animation:
      component.defaultProps?.animation || MODAL_CONFIG.ANIMATIONS.FADE,
    draggable: component.defaultProps?.draggable || false,
    closeOnEscape: component.defaultProps?.closeOnEscape ?? true,
    closeOnBackdrop: component.defaultProps?.closeOnBackdrop ?? true,
    preventBodyScroll: component.defaultProps?.preventBodyScroll ?? true,
    showCloseButton: component.defaultProps?.showCloseButton ?? true,
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

export default modalRegistry;
