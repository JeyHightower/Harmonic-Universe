import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { MODAL_TYPES } from '../constants/modalTypes';

// Import modal components
import LoginModal from '../features/auth/LoginModal';
import RegisterModal from '../features/auth/RegisterModal';
// Import other modal components as needed

// Initial state
const initialState = {
  modals: {},
};

// Action types
const OPEN_MODAL = 'OPEN_MODAL';
const CLOSE_MODAL = 'CLOSE_MODAL';
const CLOSE_ALL_MODALS = 'CLOSE_ALL_MODALS';

// Reducer
const modalReducer = (state, action) => {
  switch (action.type) {
    case OPEN_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.id]: {
            id: action.payload.id,
            type: action.payload.type,
            props: action.payload.props,
          },
        },
      };
    case CLOSE_MODAL:
      const newModals = { ...state.modals };
      delete newModals[action.payload.id];
      return {
        ...state,
        modals: newModals,
      };
    case CLOSE_ALL_MODALS:
      return {
        ...state,
        modals: {},
      };
    default:
      return state;
  }
};

// Create context
const ModalContext = createContext(initialState);

// Modal provider component
export const ModalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Add a debounce mechanism to prevent rapid reopening
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Check for modal parameters in URL
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const modalParam = searchParams.get('modal');

    // Clear any existing debounce
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new debounce
    const timeout = setTimeout(() => {
      if (modalParam === 'login') {
        console.log('Opening login modal from URL parameter');
        openModal(MODAL_TYPES.LOGIN);
      } else if (modalParam === 'register') {
        console.log('Opening register modal from URL parameter');
        openModal(MODAL_TYPES.REGISTER);
      } else {
        // If no modal parameter, close all modals
        closeAllModals();
      }
    }, 50);

    setDebounceTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [location]);

  // Open modal
  const openModal = (type, props = {}) => {
    const id = uuidv4();
    console.log(`Opening modal: ${type} with ID: ${id}`);

    dispatch({
      type: OPEN_MODAL,
      payload: { id, type, props },
    });

    // Update URL to reflect modal state (unless it already has the correct parameter)
    const searchParams = new URLSearchParams(location.search);
    const currentModal = searchParams.get('modal');
    const modalParam = type === MODAL_TYPES.LOGIN ? 'login' :
      type === MODAL_TYPES.REGISTER ? 'register' : null;

    if (modalParam && currentModal !== modalParam) {
      const url = new URL(window.location);
      url.searchParams.set('modal', modalParam);
      navigate({ pathname: location.pathname, search: url.search }, { replace: true });
    }
  };

  // Close modal
  const closeModal = (id) => {
    console.log(`Closing modal with ID: ${id}`);

    dispatch({
      type: CLOSE_MODAL,
      payload: { id },
    });

    // Remove modal parameter from URL if no modals are left open
    const modalCount = Object.keys(state.modals).length;
    if (modalCount <= 1) { // If this is the last modal
      const url = new URL(window.location);
      url.searchParams.delete('modal');
      navigate({ pathname: location.pathname, search: url.search }, { replace: true });
    }
  };

  // Close all modals
  const closeAllModals = () => {
    console.log('Closing all modals');

    dispatch({ type: CLOSE_ALL_MODALS });

    // Remove modal parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('modal');
    navigate({ pathname: location.pathname, search: url.search }, { replace: true });
  };

  // Render active modals
  const renderModals = () => {
    return Object.values(state.modals).map((modal) => {
      switch (modal.type) {
        case MODAL_TYPES.LOGIN:
          return <LoginModal key={modal.id} {...modal.props} onClose={() => closeModal(modal.id)} />;
        case MODAL_TYPES.REGISTER:
          return <RegisterModal key={modal.id} {...modal.props} onClose={() => closeModal(modal.id)} />;
        // Add other modal cases as needed
        default:
          console.error(`No modal component found for type: ${modal.type}`);
          return null;
      }
    });
  };

  // Context value
  const value = {
    modals: state.modals,
    openModal,
    closeModal,
    closeAllModals,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {renderModals()}
    </ModalContext.Provider>
  );
};

// Hook for consuming the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default ModalContext;

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
