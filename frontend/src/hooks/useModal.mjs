import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  closeModalComplete,
  openModal as openModalAction,
  updateModalProps,
} from '../store/slices/modalSlice';
import { MODAL_CONFIG } from '../utils/config';

// Define window globals to fix ESLint errors
const { setTimeout, clearTimeout } = window;

/**
 * Custom hook for managing modal state
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.defaultOpen - Whether the modal is open by default
 * @param {number} options.closeDelay - Delay in ms before closing the modal (for animations)
 * @param {Function} options.onOpen - Callback when modal opens
 * @param {Function} options.onClose - Callback when modal closes
 * @returns {Object} Modal state and handlers
 */
const useModal = (options = {}) => {
  const { defaultOpen = false, closeDelay = 300, onOpen, onClose } = options;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  // Clear the timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const openModal = useCallback(() => {
    // Clear any existing close timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsClosing(false);
    setIsOpen(true);

    if (onOpen && typeof onOpen === 'function') {
      onOpen();
    }
  }, [onOpen]);

  const closeModal = useCallback(() => {
    setIsClosing(true);

    // Use setTimeout to avoid ESLint no-undef error
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);

      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }, closeDelay);
  }, [closeDelay, onClose]);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, closeModal, openModal]);

  return {
    isOpen,
    isClosing,
    openModal,
    closeModal,
    toggleModal,
  };
};

/**
 * Hook for managing modals
 * @returns {Object} Modal management functions and state
 */
export const useModalRedux = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state) => state.modal);
  const closeTimeoutRef = useRef(null);

  const open = useCallback(
    async (type, props = {}) => {
      const { isValidModalType } = await import('../utils/modalRegistry');
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
 * Hook for using a specific modal type
 * @param {string} type - The modal type
 * @returns {Object} Modal management functions and state
 */
export const useModalType = (type) => {
  const { open, close, updateProps, isOpen, props, isTransitioning } = useModalRedux();

  const openWithType = useCallback(
    (modalProps = {}) => {
      open(type, modalProps);
    },
    [open, type]
  );

  return {
    open: openWithType,
    close,
    updateProps,
    isOpen: isOpen && props.type === type,
    props,
    isTransitioning,
  };
};

export default useModal;
