import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  closeModalComplete,
  openModal as openModalAction,
  updateModalProps,
} from '../store/slices/modalSlice';
import { MODAL_CONFIG } from '../utils/config';
import { isValidModalType } from '../utils/modalRegistry';

// Define window globals to fix ESLint errors
const { setTimeout, clearTimeout } = window;

/**
 * PRIMARY REDUX-BASED MODAL HOOK
 * This is the recommended hook to use for all modal operations
 * @returns {Object} Modal management functions and state
 */
const useModalRedux = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state) => state.modal);
  const closeTimeoutRef = useRef(null);

  const open = useCallback(
    (type, props = {}) => {
      if (!isValidModalType(type)) {
        console.error(`Invalid modal type: ${type}`);
        return;
      }

      if (modalState.isTransitioning) {
        console.warn('Modal transition in progress, ignoring open request');
        return;
      }

      try {
        dispatch(openModalAction({ type, props }));
      } catch (error) {
        console.error('Error opening modal:', error);
      }
    },
    [dispatch, modalState.isTransitioning]
  );

  const close = useCallback(() => {
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // Always dispatch closeModal to start the transition
    dispatch(closeModal());

    // Set a new timeout to complete the close after animation
    closeTimeoutRef.current = setTimeout(() => {
      dispatch(closeModalComplete());
    }, MODAL_CONFIG.ANIMATIONS.FADE.duration);
  }, [dispatch]);

  const updateProps = useCallback(
    (props) => {
      dispatch(updateModalProps(props));
    },
    [dispatch]
  );

  return {
    open,
    close,
    updateProps,
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
  const { open, close, updateProps, isOpen, props, isTransitioning } = useModalRedux();

  const openModal = useCallback((modalProps = {}) => open(type, modalProps), [open, type]);

  return {
    open: openModal,
    close,
    updateProps,
    isOpen: isOpen && props?.type === type,
    props,
    isTransitioning,
  };
};

// Make useModalRedux the default export for new code
export { useModal, useModalRedux };
export default useModalRedux;
