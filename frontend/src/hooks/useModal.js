import { useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModalContext } from '../contexts/ModalContext';
import { MODAL_TYPES } from '../utils/modalRegistry';

/**
 * Custom hook for interacting with the modal system
 * @returns {Object} Modal functions and state
 */
const useModal = () => {
    const context = useContext(ModalContext);
    const navigate = useNavigate();
    const location = useLocation();

    if (!context) {
        console.error('useModal must be used within a ModalProvider');
        return {
            openModal: () => {
                console.error('Modal context not available');
            },
            closeModal: () => {
                console.error('Modal context not available');
            },
            registerModal: () => {
                console.error('Modal context not available');
            },
            modals: [],
            isModalOpen: () => false,
        };
    }

    const {
        modals,
        openModal: contextOpenModal,
        closeModal: contextCloseModal,
        registerModal: contextRegisterModal,
        modalRegistry
    } = context;

    /**
     * Open a modal with the specified type and props
     * @param {string} modalType - The type of modal to open
     * @param {Object} props - Props to pass to the modal
     * @param {Object} options - Additional options for the modal
     */
    const openModal = useCallback((modalType, props = {}, options = {}) => {
        try {
            console.log(`Opening modal: ${modalType}`, { props, options });

            if (!modalType) {
                console.error('Modal type is required');
                return;
            }

            // Check if the modal type exists in MODAL_TYPES
            // If not, try to use it directly (for backward compatibility)
            const validModalType = Object.values(MODAL_TYPES).includes(modalType) ?
                modalType :
                Object.entries(MODAL_TYPES).find(([_, value]) => value === modalType)?.[0] || modalType;

            contextOpenModal(validModalType, props, options);
        } catch (error) {
            console.error(`Error opening modal ${modalType}:`, error);
        }
    }, [contextOpenModal]);

    /**
     * Close a modal by ID
     * @param {string} modalId - The ID of the modal to close
     */
    const closeModal = useCallback((modalId) => {
        try {
            console.log(`Closing modal: ${modalId}`);
            contextCloseModal(modalId);
        } catch (error) {
            console.error(`Error closing modal ${modalId}:`, error);
        }
    }, [contextCloseModal]);

    /**
     * Register a modal component with the modal system
     * @param {string} modalType - The type of modal to register
     * @param {Component} component - The React component to render for this modal
     * @param {Object} config - Configuration for the modal
     */
    const registerModal = useCallback((modalType, component, config = {}) => {
        try {
            console.log(`Registering modal: ${modalType}`);

            if (!modalType) {
                console.error('Modal type is required for registration');
                return;
            }

            if (!component) {
                console.error(`No component provided for modal type: ${modalType}`);
                return;
            }

            if (!contextRegisterModal) {
                console.error('registerModal function is not available in context');
                return;
            }

            contextRegisterModal(modalType, component, config);
        } catch (error) {
            console.error(`Error registering modal ${modalType}:`, error);
        }
    }, [contextRegisterModal]);

    return {
        openModal,
        closeModal,
        registerModal,
        modals,
        isModalOpen: useCallback((modalType) => {
            return modals.some(modal => modal.modalType === modalType);
        }, [modals]),
        modalRegistry
    };
};

export default useModal;
