import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  openModal,
  closeModal,
  closeModalComplete,
  updateModalProps,
} from "../store/slices/modalSlice";
import { MODAL_CONFIG } from "../utils/config";
import { isValidModalType } from "../utils/modalRegistry";

/**
 * Hook for managing modals
 * @returns {Object} Modal management functions and state
 */
export const useModal = () => {
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
        console.warn("Modal transition in progress, ignoring open request");
        return;
      }

      dispatch(openModal({ type, props }));
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
  const { open, close, updateProps, isOpen, props, isTransitioning } =
    useModal();

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
