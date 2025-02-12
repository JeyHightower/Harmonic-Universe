import { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../store/slices/modalSlice';

const ModalContext = createContext({
  openModal: () => {},
  closeModal: () => {},
});

export function ModalProvider({ children }) {
  const [modalContent, setModalContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = content => {
    setModalContent(content);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
    setTimeout(() => setModalContent(null), 300);
  };

  const value = {
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen &&
        modalContent &&
        createPortal(
          <ModalComponent onClose={closeModal}>{modalContent}</ModalComponent>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

function ModalComponent({ children, onClose }) {
  const modalState = useSelector(state => state.modal);
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeModal());
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    handleClose();
  };

  const { title, content = children, showCancel = true } = modalState;

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        <div className="modal-body">{content}</div>
        <div className="modal-actions">
          {showCancel && (
            <button className="modal-button cancel" onClick={handleClose}>
              Cancel
            </button>
          )}
          <button className="modal-button confirm" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn var(--transition-speed) ease-out;
        }

        .modal-content {
          background: var(--background-primary);
          color: var(--text-primary);
          padding: 2rem;
          border-radius: var(--border-radius);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--box-shadow);
          border: 1px solid var(--border-color);
          animation: slideIn var(--transition-speed) ease-out;
          transition: background-color var(--transition-speed),
            color var(--transition-speed), border-color var(--transition-speed);
        }

        .modal-title {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-body {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .modal-button {
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-speed);
          font-size: 0.875rem;
        }

        .modal-button.cancel {
          background-color: var(--background-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .modal-button.cancel:hover {
          background-color: var(--background-secondary);
        }

        .modal-button.confirm {
          background: linear-gradient(
            135deg,
            var(--primary-color),
            var(--secondary-color)
          );
          color: white;
          border: none;
        }

        .modal-button.confirm:hover {
          transform: translateY(-1px);
          box-shadow: var(--box-shadow);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 1.5rem;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default ModalComponent;
