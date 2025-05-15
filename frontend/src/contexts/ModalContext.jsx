import PropTypes from 'prop-types';
import { Suspense, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StableModalWrapper from '../components/modals/StableModalWrapper';
import {
  closeModal,
  openModal as openModalAction,
  selectIsModalOpen,
  selectModalProps,
  selectModalType,
  updateModalProps,
} from '../store/slices/modalSlice';
import modalRegistry from '../utils/modalRegistry';
import { ensurePortalRoot } from '../utils/portalUtils';

// Create the context - using Redux directly
const ModalContext = createContext();

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Separate component to handle modal rendering
const ModalRenderer = ({ type, props, onClose }) => {
  if (!type) return null;

  // Get the modal component from registry
  const ModalComponent = modalRegistry.getModalComponentSync(type);

  // Error state
  if (!ModalComponent) {
    return (
      <StableModalWrapper title="Error Loading Modal" open={true} onClose={onClose} width={400}>
        <div className="modal-error">
          <p>Failed to load modal component: {type}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </StableModalWrapper>
    );
  }

  // Prevent clicks inside modal content from propagating to the backdrop
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-container">
      <div className="modal-overlay" onClick={onClose}>
        <StableModalWrapper
          title={props.title}
          open={true}
          onClose={onClose}
          width={props.width || 600}
        >
          <div onClick={handleContentClick} className="modal-content">
            <ModalComponent {...props} onClose={onClose} />
          </div>
        </StableModalWrapper>
      </div>
    </div>
  );
};

ModalRenderer.propTypes = {
  type: PropTypes.string,
  props: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

// Provider component as a lightweight wrapper around Redux
export const ModalProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsModalOpen);
  const type = useSelector(selectModalType);
  const props = useSelector(selectModalProps);

  // Create the modal API to pass through context
  const modalAPI = {
    open: (type, props = {}) => dispatch(openModalAction({ type, props })),
    close: () => dispatch(closeModal()),
    updateProps: (props) => dispatch(updateModalProps(props)),
    isOpen,
    type,
    props,
  };

  // Ensure portal root exists
  ensurePortalRoot();

  return (
    <ModalContext.Provider value={modalAPI}>
      {children}
      {isOpen && (
        <Suspense
          fallback={
            <StableModalWrapper
              title="Loading..."
              open={true}
              onClose={() => console.log('Loading modal close requested')}
            >
              <div>Loading modal content...</div>
            </StableModalWrapper>
          }
        >
          <ModalRenderer type={type} props={props} onClose={modalAPI.close} />
        </Suspense>
      )}
    </ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
