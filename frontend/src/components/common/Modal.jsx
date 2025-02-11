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
    setTimeout(() => setModalContent(null), 300); // Clear after animation
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen &&
        createPortal(
          <Modal onClose={closeModal}>{modalContent}</Modal>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

function Modal() {
  const dispatch = useDispatch();
  const {
    isOpen,
    content,
    title,
    onConfirm,
    showCancel = true,
  } = useSelector(state => state.modal);

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        dispatch(closeModal());
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    dispatch(closeModal());
  };

  const handleClose = () => {
    dispatch(closeModal());
  };

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
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .modal-body {
          margin-bottom: 1.5rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .modal-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .modal-button.cancel {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .modal-button.cancel:hover {
          background-color: #e5e7eb;
        }

        .modal-button.confirm {
          background-color: var(--primary-color);
          color: white;
          border: none;
        }

        .modal-button.confirm:hover {
          background-color: #357abd;
        }
      `}</style>
    </div>
  );
}

export default Modal;
