import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openModal as openModalAction, closeModal as closeModalAction } from '../store/modalSlice';
import { MODAL_TYPES, isValidModalType } from '../utils/modalRegistry';

/**
 * Custom hook for interacting with the modal system
 * @returns {Object} Modal functions and state
 */
const useModal = () => {
    const dispatch = useDispatch();

    const openModal = useCallback((modalType, modalProps = {}) => {
        if (!modalType) {
            console.error('Modal type is required');
            return;
        }

        if (!isValidModalType(modalType)) {
            console.warn(`Unknown modal type: ${modalType}`);
        }

        dispatch(openModalAction({ modalType, modalProps }));
    }, [dispatch]);

    const closeModal = useCallback(() => {
        dispatch(closeModalAction());
    }, [dispatch]);

    return {
        openModal,
        closeModal,
    };
};

export default useModal;
