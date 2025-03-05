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
  console.log('Modal reducer action:', action.type, action.payload);
  console.log('Current state:', state);

  switch (action.type) {
    case ACTIONS.OPEN_MODAL: {
      console.log('Opening modal with payload:', action.payload);

      // Check if component is a React.memo component or a regular function component
      const component = action.payload.component;
      const isValidComponent =
        typeof component === 'function' ||
        (component &&
          typeof component === 'object' &&
          component.$$typeof === Symbol.for('react.memo') &&
          typeof component.type === 'function');

      console.log('Modal component present:', !!component);
      console.log('Is valid component:', isValidComponent);
      console.log('Modal type:', action.payload.modalType);

      if (!component || !isValidComponent) {
        console.error('Invalid component for modal:', action.payload);
        return state;
      }

      // Check if a modal of the same type already exists
      const existingModalOfSameType = state.modals.find(
        modal => modal.modalType === action.payload.modalType
      );

      if (existingModalOfSameType) {
        console.warn(
          `A modal of type ${action.payload.modalType} already exists (ID: ${existingModalOfSameType.id}). Updating it instead of creating a duplicate.`
        );

        // Instead of ignoring, update the existing modal with new props
        return {
          ...state,
          modals: state.modals.map(modal =>
            modal.modalType === action.payload.modalType
              ? { ...modal, ...action.payload, id: modal.id } // Keep the same ID but update other props
              : modal
          ),
        };
      }

      // Limit the total number of modals to 5
      if (state.modals.length >= 5) {
        console.warn(
          `Maximum number of modals (5) reached. Closing oldest modal to make room for new modal of type ${action.payload.modalType}.`
        );

        // Remove the oldest modal instead of blocking the new one
        const oldestModals = [...state.modals];
        oldestModals.shift(); // Remove the oldest modal

        return {
          ...state,
          modals: [...oldestModals, action.payload],
        };
      }

      const newState = {
        ...state,
        modals: [...state.modals, action.payload],
      };
      console.log('New state after OPEN_MODAL:', {
        modalCount: newState.modals.length,
        modalIds: newState.modals.map(m => m.id),
      });
      return newState;
    }
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
      console.log('REGISTER_MODAL action received:', action.payload);

      // Validate the component before registering
      const component = action.payload.config.component;
      if (!component) {
        console.error(
          `No component provided for modal type: ${action.payload.type}`
        );
        return state;
      }

      const isValidComponent =
        typeof component === 'function' ||
        (component &&
          typeof component === 'object' &&
          component.$$typeof === Symbol.for('react.memo') &&
          typeof component.type === 'function');

      if (!isValidComponent) {
        console.error(
          `Invalid component for modal type: ${action.payload.type}`
        );
        return state;
      }

      console.log(`Successfully registered modal type: ${action.payload.type}`);

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

  // Add a debounce mechanism to prevent rapid reopening
  const reopenTimeoutsRef = useRef({});
  const reopenAttemptsRef = useRef({});
  const maxReopenAttempts = 3;

  // Add a ref to store functions to avoid circular dependencies
  const functionsRef = useRef({});

  // Define the registerModal function using useCallback
  const registerModal = useCallback(
    (type, component, config = {}) => {
      console.log(`Registering modal type: ${type}`);

      if (!type) {
        console.error('Modal type is required for registration');
        return;
      }

      if (!component) {
        console.error(`No component provided for modal type: ${type}`);
        return;
      }

      dispatch({
        type: ACTIONS.REGISTER_MODAL,
        payload: {
          type,
          config: {
            component,
            ...config,
          },
        },
      });
    },
    [dispatch]
  );

  // Store the function in the ref to avoid circular dependencies
  functionsRef.current.registerModal = registerModal;

  // Open a modal directly with a component and props
  const openModal = useCallback(
    (component, props = {}, options = {}) => {
      console.log('Opening modal with component:', component);

      if (!component) {
        console.error('No component provided to openModal');
        return null;
      }

      // Generate a unique ID for this modal
      const id = options.id || uuidv4();

      // Dispatch the open modal action
      dispatch({
        type: ACTIONS.OPEN_MODAL,
        payload: {
          id,
          component,
          props,
          modalType: options.modalType || 'custom',
          updateUrl: options.updateUrl !== undefined ? options.updateUrl : true,
          preserveState:
            options.preserveState !== undefined ? options.preserveState : true,
          preventAutoClose:
            options.preventAutoClose !== undefined
              ? options.preventAutoClose
              : true,
          preventBackdropClick:
            options.preventBackdropClick !== undefined
              ? options.preventBackdropClick
              : true,
          ...options,
        },
      });

      // Update URL if needed
      if (options.updateUrl && options.modalType) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('modal', options.modalType);
        searchParams.set('modalId', id);

        // Add modal data to URL if provided
        if (
          props &&
          Object.keys(props).length > 0 &&
          options.includeDataInUrl
        ) {
          try {
            const encodedData = btoa(JSON.stringify(props));
            searchParams.set('modalData', encodedData);
          } catch (error) {
            console.error('Failed to encode modal data for URL:', error);
          }
        }

        const newSearch = searchParams.toString();
        const newPath = `${location.pathname}?${newSearch}`;

        // Determine whether to replace the history entry
        const shouldReplace =
          options.replace !== undefined ? options.replace : true;
        navigate(newPath, { replace: shouldReplace });
      }

      return id;
    },
    [dispatch, location, navigate]
  );

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

  // Enhanced handler for modal:reopen event
  const handleReopenModal = useCallback(
    event => {
      const { modalType, modalId, timestamp, isRetry, forceReopen, emergency } =
        event.detail || {};
      console.log(`Received modal:reopen event for ${modalType}`, event.detail);

      if (!modalType) {
        console.error('No modalType provided in modal:reopen event');
        return;
      }

      // Special handling for universe-create modals
      const isUniverseCreate =
        modalType === 'universe-create' ||
        (modalId && modalId.includes('universe-create'));

      // For emergency reopens, always force a new instance
      if (emergency) {
        console.warn(
          `Emergency reopen requested for ${modalType}. Forcing new instance.`
        );

        // Close any existing modals of this type first
        const existingModals = state.modals.filter(
          m => m.modalType === modalType
        );
        if (existingModals.length > 0) {
          console.log(
            `Closing ${existingModals.length} existing modals of type ${modalType} before emergency reopen`
          );
          existingModals.forEach(modal => {
            dispatch({
              type: ACTIONS.CLOSE_MODAL,
              payload: { id: modal.id },
            });
          });
        }

        // Open a new modal with emergency settings
        setTimeout(() => {
          openModalByType(
            modalType,
            {
              initialData: null,
              preventAutoClose: true,
              preventStateReset: true,
              forceMount: true,
              _mountTime: Date.now(),
              _emergency: true,
            },
            {
              keepInHistory: true,
              updateUrl: true,
              preventAutoClose: true,
              preventBackdropClick: true,
              preventStateReset: true,
              forceRender: true,
              forceNew: true,
            }
          );
        }, 200);

        return;
      }

      // Check if a modal of this type already exists in the DOM
      const modalElement = document.querySelector(
        `[data-modal-type="${modalType}"]`
      );

      if (modalElement) {
        console.log(
          `Modal of type ${modalType} already exists (ID: ${modalElement.getAttribute(
            'data-modal-id'
          )}). Checking if it's visible...`
        );

        // Check if the modal is visible
        const isVisible =
          modalElement.style.display !== 'none' &&
          modalElement.style.visibility !== 'hidden' &&
          modalElement.style.opacity !== '0';

        if (isVisible && !forceReopen) {
          console.log(
            'Modal element found in DOM and is visible. No need to reopen.'
          );

          // Make sure it's fully visible
          modalElement.style.display = 'block';
          modalElement.style.visibility = 'visible';
          modalElement.style.opacity = '1';
          modalElement.classList.add('force-visible');

          return;
        }

        console.log(
          'Modal element found in DOM but not visible or force reopen requested. Making it visible.'
        );

        // Make it visible
        modalElement.style.display = 'block';
        modalElement.style.visibility = 'visible';
        modalElement.style.opacity = '1';
        modalElement.classList.add('force-visible');

        // For universe-create modals or if forceReopen is true, we might need to recreate the modal
        // to ensure it's properly mounted
        if ((isUniverseCreate || forceReopen) && isRetry) {
          console.log('Force reopening the modal by recreating it');

          // Close the existing modal first
          const existingModal = state.modals.find(
            modal => modal.modalType === modalType
          );

          if (existingModal) {
            // Remove the existing modal from state
            dispatch({
              type: ACTIONS.CLOSE_MODAL,
              payload: existingModal.id,
            });

            // Wait a short time before creating a new one
            setTimeout(() => {
              // Use the function from the ref to avoid circular dependency
              if (functionsRef.current.openModalByType) {
                functionsRef.current.openModalByType(
                  modalType,
                  {},
                  { forceNew: true }
                );
              }
            }, 100);
          }

          return;
        }

        return;
      }

      // If we get here, the modal doesn't exist in the DOM, so we need to reopen it
      console.log(`No modal of type ${modalType} found in DOM. Reopening...`);

      // Check if we already have this modal type in our state
      const existingModal = state.modals.find(
        modal => modal.modalType === modalType
      );

      if (existingModal) {
        console.log(
          `Modal of type ${modalType} exists in state (ID: ${existingModal.id}). Updating it to ensure it's visible.`
        );

        // For universe-create modals or if forceReopen is true, we might need to recreate the modal
        if (isUniverseCreate || forceReopen) {
          console.log('Force reopening the modal by recreating it');

          // Close the existing modal first
          dispatch({
            type: ACTIONS.CLOSE_MODAL,
            payload: existingModal.id,
          });

          // Wait a short time before creating a new one
          setTimeout(() => {
            // Use the function from the ref to avoid circular dependency
            if (functionsRef.current.openModalByType) {
              functionsRef.current.openModalByType(
                modalType,
                {},
                { forceNew: true }
              );
            }
          }, 100);

          return;
        }

        // Update the modal to ensure it's visible
        dispatch({
          type: ACTIONS.UPDATE_MODAL,
          payload: {
            id: existingModal.id,
            data: {
              ...existingModal,
              isOpen: true,
              preventAutoClose: true,
              preventBackdropClick: true,
            },
          },
        });

        return;
      }

      // If we get here, we need to create a new modal
      console.log(
        `No modal of type ${modalType} found in state. Creating a new one.`
      );

      // Get the modal config from the registry
      const modalConfig = state.modalRegistry[modalType];
      if (!modalConfig) {
        console.error(`No modal registered for type ${modalType}`);
        return;
      }

      // Add validation for the component
      if (
        !modalConfig.component ||
        typeof modalConfig.component !== 'function'
      ) {
        console.error(
          `Invalid component for modal type ${modalType}:`,
          modalConfig.component
        );
        return null;
      }

      // Create a new modal with a unique ID
      const newModalId = `modal-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Open the modal with the registered config
      dispatch({
        type: ACTIONS.OPEN_MODAL,
        payload: {
          id: newModalId,
          component: modalConfig.component,
          props: modalConfig.props || {},
          modalProps: modalConfig.modalProps || {},
          modalType,
          updateUrl: modalConfig.updateUrl !== false,
          preserveState: true,
          preventAutoClose: true,
          preventBackdropClick: true,
          forceMount: true,
        },
      });

      console.log(
        `Created new modal of type ${modalType} with ID ${newModalId}`
      );
    },
    [state.modals, state.modalRegistry, dispatch]
  );

  // Add listener for modal:reopen custom event
  useEffect(() => {
    window.addEventListener('modal:reopen', handleReopenModal);

    return () => {
      window.removeEventListener('modal:reopen', handleReopenModal);

      // Clear any pending timeouts
      Object.values(reopenTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      reopenTimeoutsRef.current = {};
    };
  }, [handleReopenModal]);

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

  // Open a modal by its registered type
  const openModalByType = useCallback(
    (modalType, data = {}, options = {}) => {
      console.log(`openModalByType called for ${modalType}`, { data, options });
      console.log('Modal registry state:', state.modalRegistry);
      console.log('Available modal types:', Object.keys(state.modalRegistry));

      // Check if this modal type is registered
      if (!state.modalRegistry[modalType]) {
        console.error(`Modal type ${modalType} is not registered. Available types: ${Object.keys(state.modalRegistry).join(', ')}`);

        // If this is a custom modal that should be handled differently
        if (modalType === 'custom' && options.component) {
          console.log('Handling custom modal with provided component');
          // Directly use the provided component
          openModal({
            id: options.id || uuidv4(),
            component: options.component,
            props: data,
            modalType: 'custom',
            ...options
          });
          return;
        }
        return null;
      }

      // Special handling for universe-create modal
      if (modalType === 'universe-create') {
        console.log('Special handling for universe-create modal');

        // Force a new instance for universe-create modals
        options.forceNew = true;

        // Add extra protection for universe-create modals
        options.preventAutoClose = true;
        options.preventBackdropClick = true;
      }

      // Check if a modal of this type is already open
      const existingModal = state.modals.find(m => m.modalType === modalType);
      if (existingModal && !options.forceNew) {
        console.log(
          `Modal of type ${modalType} already exists (ID: ${existingModal.id}). Updating instead of creating new.`
        );

        // Update the existing modal
        dispatch({
          type: ACTIONS.UPDATE_MODAL,
          payload: {
            id: existingModal.id,
            data: {
              props: {
                ...(state.modalRegistry[modalType].getProps?.(data) || {}),
                ...data,
              },
              modalProps: {
                ...(state.modalRegistry[modalType].getModalProps?.(data) || {}),
                ...options,
                'data-modal-type': modalType,
                'data-updated-at': Date.now(),
              },
            },
          },
        });

        return existingModal.id;
      }

      // Get the registered modal configuration
      const { component, getProps, getModalProps } =
        state.modalRegistry[modalType];

      // Add validation for the component
      if (!component || typeof component !== 'function') {
        // Check if it's a React.memo component
        const isMemoComponent =
          component &&
          typeof component === 'object' &&
          component.$$typeof === Symbol.for('react.memo') &&
          typeof component.type === 'function';

        if (!isMemoComponent) {
          console.error(
            `Invalid component for modal type ${modalType}:`,
            component
          );
          return null;
        }
      }

      // Construct the modal configuration
      const modalConfig = {
        component,
        props: {
          ...(getProps ? getProps(data) : {}),
          ...data,
          // Add a key to force re-render when needed
          key: `${modalType}-${Date.now()}`,
          // Add a ref to track mounting time
          _mountTime: Date.now(),
        },
        updateUrl: options.updateUrl !== undefined ? options.updateUrl : true,
        modalType,
        preserveState:
          options.preserveState !== undefined ? options.preserveState : true,
        preventAutoClose:
          options.preventAutoClose !== undefined
            ? options.preventAutoClose
            : true,
        preventBackdropClick:
          options.preventBackdropClick !== undefined
            ? options.preventBackdropClick
            : true,
        ...(getModalProps ? getModalProps(data) : {}),
        ...options,
      };

      console.log(
        `Opening modal of type ${modalType} with config:`,
        modalConfig
      );

      // Open the modal
      return openModal(component, modalConfig.props, {
        updateUrl: modalConfig.updateUrl,
        modalType,
        preserveState: modalConfig.preserveState,
        preventAutoClose: modalConfig.preventAutoClose,
        preventBackdropClick: modalConfig.preventBackdropClick,
        ...modalConfig,
      });
    },
    [state.modalRegistry, state.modals, dispatch, openModal]
  );

  // Store the function in the ref to avoid circular dependencies
  useEffect(() => {
    functionsRef.current.openModalByType = openModalByType;
  }, [openModalByType]);

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
          const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''
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
        const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''
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
