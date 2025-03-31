import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  openModal,
  closeModal,
  closeModalComplete,
  updateModalProps,
} from "../store/slices/modalSlice";
import { MODAL_CONFIG } from "../utils/config";
import { validateModalType } from "../utils/modalRegistry";

/**
 * Hook for managing modals
 * @returns {Object} Modal management functions and state
 */
export const useModal = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state) => state.modal);

  const open = useCallback(
    (type, props = {}) => {
      if (!validateModalType(type)) {
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
    if (modalState.isTransitioning) {
      console.warn("Modal transition in progress, ignoring close request");
      return;
    }

    dispatch(closeModal());

    // Complete close after animation
    setTimeout(() => {
      dispatch(closeModalComplete());
    }, MODAL_CONFIG.ANIMATIONS.FADE.duration);
  }, [dispatch, modalState.isTransitioning]);

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
