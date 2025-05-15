import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  applyModalFixes,
  ensurePortalRoot,
  forceModalInteractivity,
} from '../../utils/portalUtils';
import {
  addDebugError,
  applyInteractionFixes,
  initializeModalPortal,
  setPointerEventsFixed,
} from '../slices/modalSlice';

/**
 * Thunk to initialize the portal element for modals
 */
export const initializeModalPortalThunk = createAsyncThunk(
  'modal/initializePortal',
  async (_, { dispatch }) => {
    try {
      const portalRoot = ensurePortalRoot();

      if (portalRoot) {
        dispatch(initializeModalPortal({ success: true }));
        return { success: true, portalId: portalRoot.id };
      } else {
        dispatch(initializeModalPortal({ success: false }));
        dispatch(addDebugError('Failed to create portal root element'));
        return { success: false, error: 'Failed to create portal root' };
      }
    } catch (error) {
      console.error('Error initializing modal portal:', error);
      dispatch(addDebugError(`Portal initialization error: ${error.message}`));
      dispatch(initializeModalPortal({ success: false }));
      return { success: false, error: error.message };
    }
  }
);

/**
 * Thunk to apply modal interaction fixes
 */
export const applyModalInteractionFixesThunk = createAsyncThunk(
  'modal/applyFixes',
  async (_, { dispatch, getState }) => {
    try {
      console.log('Applying modal interaction fixes via Redux');

      // First ensure we have a portal root
      const portalRoot = ensurePortalRoot();
      if (!portalRoot) {
        dispatch(addDebugError('Portal root not found'));
        return { success: false, error: 'Portal root not found' };
      }

      // Apply standard modal fixes
      applyModalFixes();

      // Apply aggressive modal interactivity fixes
      forceModalInteractivity();

      // Fix pointers for specific elements
      const fixedElements = fixPointerEvents();

      // Update Redux state
      dispatch(
        applyInteractionFixes({
          success: true,
          elements: fixedElements.length,
          timestamp: Date.now(),
        })
      );

      dispatch(setPointerEventsFixed(true));

      return {
        success: true,
        fixedElements,
        message: 'Modal interaction fixes applied successfully',
      };
    } catch (error) {
      console.error('Error applying modal interaction fixes:', error);
      dispatch(addDebugError(`Interaction fixes error: ${error.message}`));
      return { success: false, error: error.message };
    }
  }
);

/**
 * Thunk to fix interaction issues in a specific modal instance
 */
export const fixSpecificModalThunk = createAsyncThunk(
  'modal/fixSpecificModal',
  async ({ modalId, modalType }, { dispatch }) => {
    try {
      console.log(`Fixing specific modal: ${modalType} (${modalId})`);

      let modalElement;

      if (modalId) {
        modalElement = document.getElementById(modalId);
      } else if (modalType) {
        // Try to find the modal by its class or data attribute
        modalElement = document.querySelector(
          `.${modalType}-modal, [data-modal-type="${modalType}"], .universe-form-modal`
        );
      }

      if (!modalElement) {
        dispatch(addDebugError(`Modal element not found: ${modalType || modalId}`));
        return { success: false, error: 'Modal element not found' };
      }

      // Apply fixes directly to the modal element
      fixModalElement(modalElement);

      dispatch(
        applyInteractionFixes({
          success: true,
          elements: 1,
          timestamp: Date.now(),
        })
      );

      return { success: true, modalElement };
    } catch (error) {
      console.error('Error fixing specific modal:', error);
      dispatch(addDebugError(`Fix specific modal error: ${error.message}`));
      return { success: false, error: error.message };
    }
  }
);

/**
 * Helper function to fix pointer events for modal elements
 */
function fixPointerEvents() {
  const fixedElements = [];

  // Fix modal containers
  const modalContainers = document.querySelectorAll(
    '.modal-content, .modal-body, .ant-modal-content, .ant-modal-body, .universe-form-modal, .MuiDialog-paper'
  );

  modalContainers.forEach((container) => {
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '9999';
    container.style.position = 'relative';
    fixedElements.push({ type: 'container', id: container.id, class: container.className });

    // Fix all form elements inside this container
    const formElements = container.querySelectorAll(
      'input, textarea, select, button, [role="button"], a, .btn, .button'
    );

    formElements.forEach((element) => {
      element.style.pointerEvents = 'auto';
      element.style.position = 'relative';
      element.style.zIndex = '10000';

      if (
        element.tagName.toLowerCase() === 'button' ||
        element.getAttribute('role') === 'button' ||
        element.classList.contains('btn') ||
        element.classList.contains('button')
      ) {
        element.style.cursor = 'pointer';
      }

      // Add click stopPropagation handler
      if (!element._clickHandlerApplied) {
        const originalClick = element.onclick;
        element.onclick = (e) => {
          e.stopPropagation();
          if (originalClick) {
            originalClick(e);
          }
        };
        element._clickHandlerApplied = true;
      }

      fixedElements.push({
        type: 'element',
        tag: element.tagName,
        id: element.id,
        class: element.className,
      });
    });
  });

  return fixedElements;
}

/**
 * Helper function to fix a specific modal element
 */
function fixModalElement(modalElement) {
  if (!modalElement) return null;

  // Set main modal properties
  modalElement.style.pointerEvents = 'auto';
  modalElement.style.zIndex = '9999';
  modalElement.style.position = 'relative';

  // Find the content
  const content = modalElement.querySelector(
    '.modal-content, .ant-modal-content, .MuiDialogContent-root'
  );
  if (content) {
    content.style.pointerEvents = 'auto';
    content.style.zIndex = '10000';
    content.style.position = 'relative';
  }

  // Find the form
  const form = modalElement.querySelector('form');
  if (form) {
    form.style.pointerEvents = 'auto';
    form.style.zIndex = '10001';
    form.style.position = 'relative';

    // Stop form events from propagating
    if (!form._clickHandlerApplied) {
      form.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
        },
        true
      );
      form._clickHandlerApplied = true;
    }
  }

  // Fix all input elements
  const inputs = modalElement.querySelectorAll('input, textarea, select, button, [role="button"]');
  inputs.forEach((input) => {
    input.style.pointerEvents = 'auto';
    input.style.zIndex = '10002';
    input.style.position = 'relative';

    // Add click handler to stop propagation
    if (!input._clickHandlerApplied) {
      input.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          console.log(`Input element clicked: ${input.name || input.id || input.className}`);
        },
        true
      );
      input._clickHandlerApplied = true;
    }
  });

  return modalElement;
}
