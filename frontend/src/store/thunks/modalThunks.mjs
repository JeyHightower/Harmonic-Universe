import { createAsyncThunk } from '@reduxjs/toolkit';
import { applyInteractionFixes } from '../../store/slices/newModalSlice';
import {
    applyModalFixes,
    cleanupAllPortals,
    ensurePortalRoot,
    forceModalInteractivity
} from '../../utils/portalUtils.jsx';

/**
 * Thunk to initialize the modal portal system
 */
export const initializeModalPortalThunk = createAsyncThunk(
  'modal/initializePortal',
  async (_, { dispatch }) => {
    try {
      console.log('Modal portal initialization started');

      // Ensure the portal root exists
      const portalRoot = ensurePortalRoot();

      // Clean up any lingering portals
      cleanupAllPortals();

      console.log('Modal portal initialized successfully');

      return {
        success: true,
        portalElement: portalRoot ? true : false
      };
    } catch (error) {
      console.error('Error initializing modal portal:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
);

/**
 * Thunk to apply modal interaction fixes
 */
export const applyModalInteractionFixesThunk = createAsyncThunk(
  'modal/applyInteractionFixes',
  async (_, { dispatch }) => {
    try {
      console.log('Applying modal interaction fixes');

      // Apply fixes to modal elements
      applyModalFixes();

      // Force modal interactivity for critical elements
      forceModalInteractivity();

      // Dispatch Redux action to update state
      dispatch(applyInteractionFixes({
        zIndex: {
          baseModal: 1050,
          baseContent: 1055,
          baseForm: 1060,
          baseInputs: 1065,
        },
        pointer: {
          enabled: true,
          fixed: true
        }
      }));

      console.log('Modal interaction fixes applied successfully');

      return {
        success: true,
        appliedAt: Date.now()
      };
    } catch (error) {
      console.error('Error applying modal interaction fixes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
);
