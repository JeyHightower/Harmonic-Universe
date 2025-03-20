import { MODAL_TYPES } from '../../utils/modalRegistry';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

// Map modal types to their respective components
export const MODAL_COMPONENTS = {
    [MODAL_TYPES.LOGIN]: LoginModal,
    [MODAL_TYPES.SIGNUP]: SignupModal,
};

// Get modal component by type
export const getModalComponent = (modalType) => {
    return MODAL_COMPONENTS[modalType] || null;
};
