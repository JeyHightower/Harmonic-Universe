/**
 * Modal helper functions to create various types of modals
 */

import React from 'react';

// Import the PhysicsParametersModal component
import UniverseCreate from '../components/features/universe/UniverseCreate';
import PhysicsParametersModal from '../features/physicsParameters/PhysicsParametersModal';

// Alert Modal Component
const AlertModalContent = ({ message, onClose }) =>
  React.createElement('div', { className: 'alert-modal-content' },
    React.createElement('p', null, message),
    React.createElement('div', { className: 'modal-actions' },
      React.createElement('button', {
        className: 'btn btn-primary',
        onClick: onClose
      }, 'OK')
    )
  );

// Confirm Modal Component
const ConfirmModalContent = ({ message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive, onClose }) =>
  React.createElement('div', { className: 'confirm-modal-content' },
    React.createElement('p', null, message),
    React.createElement('div', { className: 'modal-actions' },
      React.createElement('button', {
        className: `btn ${isDestructive ? 'btn-danger' : 'btn-secondary'}`,
        onClick: () => {
          if (onCancel) onCancel();
          onClose();
        }
      }, cancelText),
      React.createElement('button', {
        className: 'btn btn-primary',
        onClick: () => {
          if (onConfirm) onConfirm();
          onClose();
        }
      }, confirmText)
    )
  );

/**
 * Creates an alert modal configuration
 * @param {string} message - The alert message to display
 * @param {Object} options - Additional modal options
 * @returns {Object} Modal configuration
 */
export const createAlertModal = (message, options = {}) => {
  return {
    component: AlertModalContent,
    props: {
      message
    },
    modalProps: {
      title: options.title || 'Alert',
      size: options.size || 'small',
      type: 'alert',
      animation: options.animation || 'fade',
      position: options.position || 'center',
      preventBackdropClick: options.preventBackdropClick || false
    }
  };
};

/**
 * Creates a confirmation modal configuration
 * @param {string} message - The confirmation message to display
 * @param {function} onConfirm - Function to call when confirmed
 * @param {Object} options - Additional modal options
 * @returns {Object} Modal configuration
 */
export const createConfirmModal = (message, onConfirm, options = {}) => {
  return {
    component: ConfirmModalContent,
    props: {
      message,
      onConfirm,
      onCancel: options.onCancel || (() => { }),
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      isDestructive: options.isDestructive || false
    },
    modalProps: {
      title: options.title || 'Confirm',
      size: options.size || 'small',
      type: 'confirm',
      animation: options.animation || 'fade',
      position: options.position || 'center',
      preventBackdropClick: true
    }
  };
};

/**
 * Creates a form modal configuration
 * @param {React.Component} FormComponent - The form component to render
 * @param {Object} formProps - Props to pass to the form component
 * @param {Object} options - Additional modal options
 * @returns {Object} Modal configuration
 */
export const createFormModal = (FormComponent, formProps = {}, options = {}) => {
  return {
    component: FormComponent,
    props: {
      ...formProps
    },
    modalProps: {
      title: options.title || 'Form',
      size: options.size || 'medium',
      type: 'form',
      animation: options.animation || 'fade',
      position: options.position || 'center',
      preventBackdropClick: options.preventBackdropClick || false,
      showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true,
      footerContent: options.footerContent
    }
  };
};

/**
 * Creates a custom modal configuration
 * @param {React.Component} Component - The component to render in the modal
 * @param {Object} options - Additional modal options
 * @returns {Object} Modal configuration
 */
export const createCustomModal = (Component, options = {}) => {
  return {
    id: `custom-${Date.now()}`,
    type: 'custom',
    title: options.title || '',
    content: Component,
    size: options.size || 'medium',
    onClose: options.onClose,
    showCloseButton:
      options.showCloseButton !== undefined ? options.showCloseButton : true,
    zIndex: options.zIndex || 1000,
    data: options.data,
  };
};

export const createPhysicsParametersModal = (universeId, initialData = null, options = {}) => ({
  component: props =>
    React.createElement(PhysicsParametersModal, {
      universeId: universeId,
      initialData: initialData,
      isGlobalModal: true,
      ...props
    }),
  props: {},
  modalProps: {
    title: initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters',
    size: options.size || 'medium',
    type: 'form',
    animation: options.animation || 'fade',
    position: options.position || 'center',
    preventBackdropClick: options.preventBackdropClick || false,
  },
});

/**
 * Creates a universe creation modal configuration
 * @param {function} onSuccess - Function to call when universe is created
 * @param {Object} options - Additional modal options
 * @returns {Object} Modal configuration
 */
export const createUniverseModal = (onSuccess, options = {}) => {
  return {
    component: UniverseCreate,
    props: {
      onSuccess
    },
    modalProps: {
      title: options.title || 'Create New Universe',
      size: options.size || 'medium',
      type: 'form',
      animation: options.animation || 'slide',
      position: options.position || 'center',
      preventBackdropClick: options.preventBackdropClick || true
    }
  };
};
