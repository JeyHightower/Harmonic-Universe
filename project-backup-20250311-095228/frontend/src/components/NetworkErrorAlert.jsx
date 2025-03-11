import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setNetworkError } from '../store/authSlice';
import useModal from '../hooks/useModal';
import { MODAL_TYPES } from '../utils/modalRegistry';
import { API_CONFIG } from '../utils/config';

/**
 * Component that monitors for network errors and displays an alert
 * This helps users understand why certain features might not be working
 */
const NetworkErrorAlert = () => {
    const { networkError, offlineMode } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const { openModal } = useModal();
    const [hasShownModal, setHasShownModal] = useState(false);
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const checkApiConnection = useCallback(async () => {
        if (isCheckingConnection) return;
        setIsCheckingConnection(true);

        try {
            console.debug('Checking API connection...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HEALTH_CHECK.TIMEOUT);

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.HEALTH_CHECK.ENDPOINT}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: controller.signal
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
    }, [dispatch, networkError, isCheckingConnection]);

    const handleConnectionError = async () => {
        if (retryCount < API_CONFIG.HEALTH_CHECK.RETRY_ATTEMPTS) {
            setRetryCount(prev => prev + 1);
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.ERROR_HANDLING.RETRY_DELAY));
            return checkApiConnection();
        }
        dispatch(setNetworkError(true));
    };

    // Check API connection periodically
    useEffect(() => {
        checkApiConnection();
        const interval = setInterval(checkApiConnection, API_CONFIG.HEALTH_CHECK.INTERVAL);
        return () => clearInterval(interval);
    }, [checkApiConnection]);

    // Show modal when network error is detected
    useEffect(() => {
        if (networkError && !hasShownModal && document.getElementById('portal-root')) {
            const message = offlineMode
                ? 'Unable to connect to server. Application is running in offline mode with limited functionality.'
                : 'Could not connect to server. Some features may be unavailable.';

            const timer = setTimeout(() => {
                console.debug('Opening network error modal');
                openModal(MODAL_TYPES.NETWORK_ERROR, { message });
                setHasShownModal(true);
            }, API_CONFIG.ERROR_HANDLING.NETWORK_ERROR_THRESHOLD);

            return () => clearTimeout(timer);
        }
    }, [networkError, offlineMode, openModal, hasShownModal]);

    return null;
};

export default NetworkErrorAlert;
