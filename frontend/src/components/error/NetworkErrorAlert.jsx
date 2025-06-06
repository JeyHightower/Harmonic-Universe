import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useModalState } from '../../hooks/useModalState';
import { setNetworkError } from '../../store/actions/authActions.mjs';
import { API_CONFIG, MODAL_TYPES } from '../../utils/config';

/**
 * Component that monitors for network errors and displays an alert
 * This helps users understand why certain features might not be working
 */
const NetworkErrorAlert = () => {
  const { networkError, offlineMode } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { open } = useModalState();
  const [hasShownModal, setHasShownModal] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  const checkApiConnection = useCallback(
    async (force = false) => {
      // Prevent checking too frequently - at least 5 seconds between checks
      const now = Date.now();
      if (!force && now - lastCheckTime < 5000) {
        console.debug('Skipping API check - checked too recently');
        return;
      }

      if (isCheckingConnection) return;
      setIsCheckingConnection(true);
      setLastCheckTime(now);

      try {
        console.debug('Checking API connection...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HEALTH_CHECK.TIMEOUT);

        const response = await fetch(`${API_CONFIG.HEALTH_CHECK.ENDPOINT}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (networkError) {
            console.debug('API connection restored');
            dispatch(setNetworkError(false));
            setHasShownModal(false);
          }
          setRetryCount(0);
        } else {
          console.warn('API returned error status:', response.status);
          await handleConnectionError();
        }
      } catch (error) {
        console.error('API connection check failed:', error);
        if (error.name === 'AbortError') {
          console.warn('API connection check timed out');
        }
        await handleConnectionError();
      } finally {
        setIsCheckingConnection(false);
      }
    },
    [dispatch, networkError, isCheckingConnection, lastCheckTime]
  );

  const handleConnectionError = async () => {
    if (retryCount < API_CONFIG.HEALTH_CHECK.RETRY_ATTEMPTS) {
      setRetryCount((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, API_CONFIG.ERROR_HANDLING.RETRY_DELAY));
      return checkApiConnection(true);
    }
    dispatch(setNetworkError(true));
  };

  // Check API connection periodically - but use a longer interval (60 seconds minimum)
  useEffect(() => {
    // Initial check with a delay to avoid immediate check on mount
    const initialCheck = setTimeout(() => checkApiConnection(), 2000);

    // Use a longer interval than configured to prevent excessive checks
    const checkInterval = Math.max(60000, API_CONFIG.HEALTH_CHECK.INTERVAL);
    const interval = setInterval(() => checkApiConnection(), checkInterval);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkApiConnection]);

  // Show network error modal with retry option
  const showNetworkErrorModal = useCallback(() => {
    if (!hasShownModal) {
      open(MODAL_TYPES.ALERT, {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.',
        actions: [
          {
            label: 'Retry',
            onClick: () => {
              setIsCheckingConnection(true);
              checkApiConnection()
                .then((isOnline) => {
                  if (isOnline) {
                    dispatch(setNetworkError(false));
                  }
                })
                .finally(() => {
                  setIsCheckingConnection(false);
                });
            },
          },
          {
            label: 'Dismiss',
            onClick: () => {},
          },
        ],
      });
      setHasShownModal(true);
    }
  }, [dispatch, hasShownModal, open]);

  // Show modal when network error is detected
  useEffect(() => {
    if (networkError && !hasShownModal && document.getElementById('portal-root')) {
      const message = offlineMode
        ? 'Unable to connect to server. Application is running in offline mode with limited functionality.'
        : 'Could not connect to server. Some features may be unavailable.';

      const timer = setTimeout(() => {
        console.debug('Opening network error modal');
        showNetworkErrorModal();
      }, API_CONFIG.ERROR_HANDLING.NETWORK_ERROR_THRESHOLD);

      return () => clearTimeout(timer);
    }
  }, [networkError, offlineMode, showNetworkErrorModal]);

  return null;
};

export default NetworkErrorAlert;
