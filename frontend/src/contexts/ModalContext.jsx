import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  modals: [], // Array of modal objects
  modalRegistry: {}, // Registry of modal types to component mappings
};

// Action types
const ACTIONS = {
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  CLOSE_ALL_MODALS: 'CLOSE_ALL_MODALS',
  UPDATE_MODAL: 'UPDATE_MODAL',
  REGISTER_MODAL: 'REGISTER_MODAL',
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
    case ACTIONS.REGISTER_MODAL:
      return {
        ...state,
        modalRegistry: {
          ...state.modalRegistry,
          [action.payload.type]: action.payload.config,
        },
      };
    default:
      return state;
  }
};

// Create context
export const ModalContext = createContext(initialState);

export const ModalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize from URL if needed
  useEffect(() => {
    if (isInitialized) return;

    const searchParams = new URLSearchParams(location.search);
    const modalType = searchParams.get('modal');
    const modalId = searchParams.get('modalId');
    const modalData = searchParams.get('modalData');

    // If URL has modal info but no matching modal is open, try to open it
    if (modalType && !state.modals.some(m => m.id === modalId)) {
      const registeredModal = state.modalRegistry[modalType];

      if (registeredModal) {
        // Parse modalData if it exists
        let parsedData = {};
        if (modalData) {
          try {
            parsedData = JSON.parse(atob(modalData));
          } catch (error) {
            console.error('Failed to parse modal data:', error);
          }
        }

        // Open the registered modal with the provided data
        const { component, getProps, getModalProps } = registeredModal;

        const id = modalId || uuidv4();
        const modalConfig = {
          id,
          component,
          props: getProps ? getProps(parsedData) : parsedData,
          modalProps: {
            isOpen: true,
            size: 'medium',
            type: 'default',
            animation: 'fade',
            position: 'center',
            ...(getModalProps ? getModalProps(parsedData) : {}),
          },
          modalType,
        };

        dispatch({
          type: ACTIONS.OPEN_MODAL,
          payload: modalConfig,
        });
      }
    }

    setIsInitialized(true);
  }, [location, state.modalRegistry, state.modals, isInitialized]);

  // Handle URL changes to sync with modal state
  useEffect(() => {
    if (!isInitialized) return;

    // Check if there's a modal parameter in the URL
    const searchParams = new URLSearchParams(location.search);
    const modalType = searchParams.get('modal');
    const modalId = searchParams.get('modalId');

    // If modals close, update URL (only if URL has modal params)
    if (state.modals.length === 0 && (modalType || modalId)) {
      // Remove modal params from URL without adding to history
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('modal');
      newSearchParams.delete('modalId');
      newSearchParams.delete('modalData');

      const newSearch = newSearchParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

      navigate(newPath, { replace: true });
    }
  }, [location, navigate, state.modals, isInitialized]);

  // Register a modal type with its component and config
  const registerModal = useCallback(
    (type, component, { getProps, getModalProps } = {}) => {
      dispatch({
        type: ACTIONS.REGISTER_MODAL,
        payload: {
          type,
          config: {
            component,
            getProps,
            getModalProps,
          },
        },
      });
    },
    []
  );

  // Open a new modal
  const openModal = useCallback(
    ({
      component,
      props = {},
      modalProps = {},
      updateUrl = false,
      modalType = '',
      preserveState = false,
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

        // Store modal state in URL if preserveState is true
        if (preserveState && Object.keys(props).length > 0) {
          // Base64 encode the props to keep URL clean
          const encodedData = btoa(JSON.stringify(props));
          searchParams.set('modalData', encodedData);
        }

        navigate(`${location.pathname}?${searchParams.toString()}`, {
          replace: !preserveState, // Only replace if we're not preserving state
        });
      }

      return id; // Return ID so caller can close this specific modal later
    },
    [navigate, location]
  );

  // Open a registered modal by type
  const openModalByType = useCallback(
    (modalType, data = {}, options = {}) => {
      const registeredModal = state.modalRegistry[modalType];

      if (!registeredModal) {
        console.error(`Modal type '${modalType}' is not registered`);
        return null;
      }

      const { component, getProps, getModalProps } = registeredModal;

      return openModal({
        component,
        props: getProps ? getProps(data) : data,
        modalProps: getModalProps ? getModalProps(data) : {},
        updateUrl: options.updateUrl !== undefined ? options.updateUrl : true,
        modalType,
        preserveState:
          options.preserveState !== undefined ? options.preserveState : true,
      });
    },
    [state.modalRegistry, openModal]
  );

  // Close a specific modal by ID
  const closeModal = useCallback(
    (id, options = {}) => {
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
          searchParams.delete('modalData');

          const newSearch = searchParams.toString();
          const newPath = `${location.pathname}${
            newSearch ? `?${newSearch}` : ''
          }`;

          // Determine whether to replace the history entry
          const shouldReplace =
            options.replace !== undefined ? options.replace : true;
          navigate(newPath, { replace: shouldReplace });
        }
      }
    },
    [state.modals, navigate, location]
  );

  // Close all modals
  const closeAllModals = useCallback(
    (options = {}) => {
      dispatch({
        type: ACTIONS.CLOSE_ALL_MODALS,
      });

      // Clean up URL if it has modal params
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.has('modal') ||
        searchParams.has('modalId') ||
        searchParams.has('modalData')
      ) {
        searchParams.delete('modal');
        searchParams.delete('modalId');
        searchParams.delete('modalData');

        const newSearch = searchParams.toString();
        const newPath = `${location.pathname}${
          newSearch ? `?${newSearch}` : ''
        }`;

        // Determine whether to replace the history entry
        const shouldReplace =
          options.replace !== undefined ? options.replace : true;
        navigate(newPath, { replace: shouldReplace });
      }
    },
    [navigate, location]
  );

  // Update an existing modal
  const updateModal = useCallback((id, data) => {
    dispatch({
      type: ACTIONS.UPDATE_MODAL,
      payload: { id, data },
    });
  }, []);

  // Get URL for a modal (for deep linking)
  const getModalUrl = useCallback(
    (modalType, data = {}, basePath = location.pathname) => {
      const id = uuidv4();
      const searchParams = new URLSearchParams();
      searchParams.set('modal', modalType);
      searchParams.set('modalId', id);

      if (Object.keys(data).length > 0) {
        const encodedData = btoa(JSON.stringify(data));
        searchParams.set('modalData', encodedData);
      }

      return `${basePath}?${searchParams.toString()}`;
    },
    [location]
  );

  // Context value
  const value = {
    modals: state.modals,
    modalRegistry: state.modalRegistry,
    openModal,
    openModalByType,
    closeModal,
    closeAllModals,
    updateModal,
    registerModal,
    getModalUrl,
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
