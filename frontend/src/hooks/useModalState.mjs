import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeModal,
  openModal,
  selectIsModalOpen,
  selectIsModalTransitioning,
  selectModalProps,
  selectModalType,
  updateModalProps,
} from '../store/slices/newModalSlice';

/**
 * Hook for managing modal state with Redux
 * @returns {Object} Modal methods and state
 */
const useModalState = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsModalOpen);
  const type = useSelector(selectModalType);
  const props = useSelector(selectModalProps);
  const isTransitioning = useSelector(selectIsModalTransitioning);

  const open = useCallback(
    (modalType, modalProps = {}) => {
      dispatch(openModal({ type: modalType, props: modalProps }));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const update = useCallback(
    (newProps = {}) => {
      dispatch(updateModalProps(newProps));
    },
    [dispatch]
  );

  return {
    isOpen,
    type,
    props,
    isTransitioning,
    open,
    close,
    update,
  };
};

/**
 * Hook for managing a specific modal type
 * @param {string} modalType - The type of modal to manage
 * @returns {Object} Modal methods and state for the specific type
 */
export const useModalTypeState = (modalType) => {
  const { open, close, update, isOpen, type, props, isTransitioning } = useModalState();

  const openModal = useCallback(
    (modalProps = {}) => {
      open(modalType, modalProps);
    },
    [open, modalType]
  );

  const isThisModalOpen = isOpen && type === modalType;

  return {
    open: openModal,
    close,
    update,
    isOpen: isThisModalOpen,
    props,
    isTransitioning,
  };
};

// Add named export
export { useModalState };

export default useModalState;
