import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setNetworkError } from '../store/authSlice';
import useModal from '../hooks/useModal';
import { MODAL_TYPES } from '../utils/modalRegistry';

/**
 * Component that monitors for network errors and displays an alert
 * This helps users understand why certain features might not be working
 */
const NetworkErrorAlert = () => {
    const { networkError, offlineMode } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const { openModal } = useModal();
    const [hasShownModal, setHasShownModal] = useState(false);

    // Check API connection periodically
    useEffect(() => {
        // Function to check if the API is reachable
        const checkApiConnection = async () => {
            try {
                // Try to fetch the API health endpoint
                console.log('Checking API connection...');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch('/api/health', {
                    method: 'GET',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    // If we can connect, clear any network error
                    if (networkError) {
                        console.log('API connection restored');
                        dispatch(setNetworkError(false));
                    }
                } else {
                    // If we get a non-200 response, set network error
                    console.warn('API returned error status:', response.status);
                    dispatch(setNetworkError(true));
                }
            } catch (error) {
                console.error('API connection check failed:', error);
                dispatch(setNetworkError(true));
            }
        };

        // Check connection immediately
        checkApiConnection();

        // Then check periodically
        const interval = setInterval(checkApiConnection, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [dispatch, networkError]);

    // Show modal when network error is detected
    useEffect(() => {
        if (networkError && !hasShownModal) {
            // Only show the modal once per session to avoid annoying the user
            const message = offlineMode
                ? 'Unable to connect to server. Application is running in offline mode with limited functionality.'
                : 'Could not connect to server. Some features may be unavailable.';

            // Delay the modal to avoid immediate popup on page load
            const timer = setTimeout(() => {
                console.log('Opening network error modal');
                openModal(MODAL_TYPES.NETWORK_ERROR, { message });
                setHasShownModal(true);
            }, 2000);

            return () => clearTimeout(timer);
        }

        // Reset the flag if connection is restored
        if (!networkError && hasShownModal) {
            setHasShownModal(false);
        }
    }, [networkError, offlineMode, openModal, hasShownModal]);

    // This component doesn't render anything visible
    return null;
};

export default NetworkErrorAlert;
