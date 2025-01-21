import PropTypes from 'prop-types';
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react';

const NotificationContext = createContext(null);

const initialState = {
  notifications: [],
};

const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
};

function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback(
    ({
      message,
      type = 'info',
      duration = 5000,
      details,
      category,
      variant = 'toast',
    }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const notification = {
        id,
        message,
        type,
        duration,
        details,
        category,
        variant,
        timestamp: new Date(),
      };

      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });

      if (duration) {
        setTimeout(() => {
          dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
        }, duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback(id => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  const showError = useCallback(
    (message, options = {}) => {
      return addNotification({
        message,
        type: 'error',
        duration: 7000,
        ...options,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return addNotification({
        message,
        type: 'warning',
        duration: 5000,
        ...options,
      });
    },
    [addNotification]
  );

  const showSuccess = useCallback(
    (message, options = {}) => {
      return addNotification({
        message,
        type: 'success',
        duration: 3000,
        ...options,
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return addNotification({
        message,
        type: 'info',
        duration: 4000,
        ...options,
      });
    },
    [addNotification]
  );

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
}
