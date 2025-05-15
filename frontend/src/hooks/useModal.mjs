import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  closeModalComplete,
  openModal as openModalAction,
  resetModalState,
  updateModalProps,
} from '../store/slices/modalSlice';
import { MODAL_CONFIG } from '../utils/config';
import { isValidModalType } from '../utils/modalRegistry';

// Define window globals to fix ESLint errors
const { setTimeout, clearTimeout } = window;

// Timeout constants for better management
const DEBOUNCE_TIMEOUT = 50;
const STUCK_TIMEOUT = 2000;
const TRANSITION_TIMEOUT = MODAL_CONFIG.ANIMATIONS.FADE.duration + 50; // Add small buffer

/**
 * PRIMARY REDUX-BASED MODAL HOOK
 * This is the recommended hook to use for all modal operations
 * @returns {Object} Modal management functions and state
 */
const useModalRedux = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state) => state.modal);
  const closeTimeoutRef = useRef(null);
  const openTimeoutRef = useRef(null);
  const transitionTimeoutRef = useRef(null);

  // Effect to check for stuck transitions
  useEffect(() => {
    // If modal is transitioning, set a safety timeout to ensure it completes
    if (modalState.isTransitioning) {
      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set a timeout to force complete any stuck transitions
      transitionTimeoutRef.current = setTimeout(() => {
        // Check if we're still transitioning after the timeout
        const stillTransitioning = modalState.isTransitioning;
        if (stillTransitioning) {
          console.log('Modal transition appears stuck, forcing completion');
          if (modalState.isOpen) {
            // If open and stuck, force complete opening
            dispatch(updateModalProps({ _forceCompleteTransition: true }));
          } else {
            // If closing and stuck, force complete closing
            dispatch(closeModalComplete());
          }
        }
      }, TRANSITION_TIMEOUT * 1.5); // Give extra time beyond normal transition

      return () => {
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [dispatch, modalState.isTransitioning, modalState.isOpen]);

  const open = useCallback(
    (type, props = {}) => {
      if (!isValidModalType(type)) {
        console.error(`Invalid modal type: ${type}`);
        return;
      }

      // Clear any existing timeouts
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // If there's an ongoing transition that's been stuck for too long, reset it
      if (modalState.isTransitioning) {
        const currentTime = Date.now();
        const lastUpdateTime = modalState.lastUpdateTime || 0;
        // If it's been stuck in transition for more than STUCK_TIMEOUT, force reset
        if (currentTime - lastUpdateTime > STUCK_TIMEOUT) {
          console.log('Modal appears stuck in transition, resetting modal state');
          dispatch(resetModalState());
        } else {
          console.log('Modal transition in progress, queueing instead of ignoring');
          // Let it queue in the reducer instead of blocking
        }
      }

      // Add a small debounce to prevent rapid requests
      openTimeoutRef.current = setTimeout(() => {
        try {
          dispatch(openModalAction({ type, props }));
        } catch (error) {
          console.error('Error opening modal:', error);
        }
      }, DEBOUNCE_TIMEOUT);
    },
    [dispatch, modalState.isTransitioning, modalState.lastUpdateTime]
  );

  const close = useCallback(() => {
    // Clear any existing timeouts
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }

    // Always dispatch closeModal to start the transition
    dispatch(closeModal());

    // Set a new timeout to complete the close after animation
    closeTimeoutRef.current = setTimeout(() => {
      dispatch(closeModalComplete());
    }, TRANSITION_TIMEOUT);
  }, [dispatch]);

  const updateProps = useCallback(
    (props) => {
      dispatch(updateModalProps(props));
    },
    [dispatch]
  );

  // Add a function to force reset modal state if needed
  const resetModal = useCallback(() => {
    // Clear any existing timeouts
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    dispatch(resetModalState());
  }, [dispatch]);

  return {
    open,
    close,
    updateProps,
    resetModal,
    isOpen: modalState.isOpen,
    type: modalState.type,
    props: modalState.props,
    isTransitioning: modalState.isTransitioning,
  };
};

/**
 * @deprecated Use useModalRedux instead - this alias is for backward compatibility only
 */
const useModal = () => {
  console.warn('DEPRECATED: useModal() is deprecated. Use useModalRedux() instead.');
  return useModalRedux();
};

export const useModalType = (type) => {
  const { open, close, updateProps, isOpen, props, isTransitioning, resetModal } = useModalRedux();

  const openModal = useCallback((modalProps = {}) => open(type, modalProps), [open, type]);

  return {
    open: openModal,
    close,
    updateProps,
    resetModal,
    isOpen: isOpen && props?.type === type,
    props,
    isTransitioning,
  };
};

// Make useModalRedux the default export for new code
export { useModal, useModalRedux };
export default useModalRedux;
