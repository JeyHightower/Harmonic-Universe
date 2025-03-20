import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  modals: [], // Array of modal objects
};

// Action types
const ACTIONS = {
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',
  UPDATE_MODAL: 'UPDATE_MODAL',
};

// Reducer function
const modalReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modals: [...state.modals, action.payload],
      };
    case ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modals: state.modals.filter(modal => modal.id !== action.payload),
      };
    case ACTIONS.CLOSE_ALL_MODALS:
      return {
        ...state,
        modals: [],
      };
    case ACTIONS.UPDATE_MODAL:
      return {
        ...state,
        modals: state.modals.map(modal =>
          modal.id === action.payload.id
            ? { ...modal, ...action.payload.data }
            : modal
        ),
      };
    default:
      return state;
  }
};

// Create context
const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle URL changes to sync with modal state
  useEffect(() => {
    // Check if there's a modal parameter in the URL
    const searchParams = new URLSearchParams(location.search);
    const modalType = searchParams.get('modal');
    const modalId = searchParams.get('modalId');

    // If URL has modal info but no matching modal is open, try to open it
    if (modalType && !state.modals.some(m => m.id === modalId)) {
      // This would require additional handling based on your app's needs
      // For example, you might have a mapping of modal types to components
    }

    // If modals close, update URL (only if URL has modal params)
    if (state.modals.length === 0 && (modalType || modalId)) {
      // Remove modal params from URL without adding to history
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('modal');
      newSearchParams.delete('modalId');

      const newSearch = newSearchParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

      navigate(newPath, { replace: true });
    }
  }, [location, navigate, state.modals]);

  // Open a new modal
  const openModal = useCallback(
    ({
      component,
      props = {},
      modalProps = {},
      updateUrl = false,
      modalType = '',
    }) => {
      const id = uuidv4();
      const modalConfig = {
        id,
        component,
        props,
        modalProps: {
          isOpen: true,
          size: 'medium',
          type: 'default',
          animation: 'fade',
          position: 'center',
          ...modalProps,
        },
        modalType,
      };

      dispatch({
        type: ACTIONS.OPEN_MODAL,
        payload: modalConfig,
      });

      // Update URL if specified
      if (updateUrl && modalType) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('modal', modalType);
        searchParams.set('modalId', id);

        navigate(`${location.pathname}?${searchParams.toString()}`, {
          replace: true, // Replace current history entry to avoid navigation issues
        });
      }

      return id; // Return ID so caller can close this specific modal later
    },
    [navigate, location]
  );

  // Close a specific modal by ID
  const closeModal = useCallback(
    id => {
      const modalToClose = state.modals.find(modal => modal.id === id);

      dispatch({
        type: ACTIONS.CLOSE_MODAL,
        payload: id,
      });

      // If this modal updated the URL, clean it up
      if (modalToClose && modalToClose.modalType) {
        const searchParams = new URLSearchParams(window.location.search);
        const urlModalId = searchParams.get('modalId');

        // Only update URL if this specific modal is in the URL
        if (urlModalId === id) {
          searchParams.delete('modal');
          searchParams.delete('modalId');

          const newSearch = searchParams.toString();
          const newPath = `${location.pathname}${
            newSearch ? `?${newSearch}` : ''
          }`;

          navigate(newPath, { replace: true });
        }
      }
    },
    [state.modals, navigate, location]
  );

  // Close all modals
  const closeAllModals = useCallback(() => {
    dispatch({
      type: ACTIONS.CLOSE_ALL_MODALS,
    });

    // Clean up URL if it has modal params
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('modal') || searchParams.has('modalId')) {
      searchParams.delete('modal');
      searchParams.delete('modalId');

      const newSearch = searchParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

      navigate(newPath, { replace: true });
    }
  }, [navigate, location]);

  // Update an existing modal
  const updateModal = useCallback((id, data) => {
    dispatch({
      type: ACTIONS.UPDATE_MODAL,
      payload: { id, data },
    });
  }, []);

  // Context value
  const value = {
    modals: state.modals,
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default ModalContext;
