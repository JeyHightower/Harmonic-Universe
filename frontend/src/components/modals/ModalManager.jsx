import { lazy, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useModalState from '../../hooks/useModalState';
import {
  selectIsModalOpen,
  selectModalProps,
  selectModalType,
} from '../../store/slices/newModalSlice';
import Modal from './Modal';

// Dynamically import modal components to reduce initial bundle size
const AlertModal = lazy(() => import('./AlertModal'));
const ConfirmationModal = lazy(() => import('./ConfirmationModal'));
const FormModal = lazy(() => import('./FormModal'));
const TestModal = lazy(() => import('./TestModal'));
const LoginModal = lazy(() => import('../../features/auth/modals/LoginModal'));
const SignupModal = lazy(() => import('../../features/auth/modals/SignupModal'));

// Map of modal types to components
const MODAL_COMPONENTS = {
  ALERT: AlertModal,
  CONFIRMATION: ConfirmationModal,
  FORM: FormModal,
  TEST_MODAL: TestModal,
  LOGIN: LoginModal,
  SIGNUP: SignupModal,
};

/**
 * ModalManager component that renders the correct modal based on Redux state
 * This component should be mounted once at the application root
 */
const ModalManager = () => {
  const isOpen = useSelector(selectIsModalOpen);
  const type = useSelector(selectModalType);
  const props = useSelector(selectModalProps);
  const { close } = useModalState();

  // Effect for body scroll locking
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Render nothing if no modal is open
  if (!isOpen || !type) {
    return null;
  }

  // Get the appropriate modal component
  const ModalComponent = MODAL_COMPONENTS[type];

  // If no matching component, render nothing
  if (!ModalComponent) {
    console.warn(`No modal component found for type: ${type}`);
    return null;
  }

  // Extract modal-specific props from props, rest goes to the component
  const {
    title,
    size = 'medium',
    position = 'center',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
    ...componentProps
  } = props;

  return (
    <Suspense fallback={<div className="modal-loading">Loading...</div>}>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={title}
        size={size}
        position={position}
        closeOnEscape={closeOnEscape}
        closeOnBackdrop={closeOnBackdrop}
        showCloseButton={showCloseButton}
      >
        <ModalComponent onClose={close} {...componentProps} />
      </Modal>
    </Suspense>
  );
};

export default ModalManager;
