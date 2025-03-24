/**
 * Provides fallback authentication during development or when backend is unavailable
 * This allows the app to function in offline mode for development purposes
 */
export const handleOfflineAuthentication = () => {
    console.warn('Using offline authentication fallback - backend connection unavailable');

    // Return a mock user and token for development purposes
    return {
        user: {
            id: 'demo-user',
            username: 'demo',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            role: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        token: 'demo-token-' + Math.random().toString(36).substring(2, 15),
        message: 'Logged in with offline fallback mode',
        offlineMode: true
    };
};

/**
 * Check if we should use the fallback authentication
 * @param {Error} error - The error from the API call
 * @returns {boolean} - Whether to use the fallback
 */
export const shouldUseFallback = (error) => {
    // Always use fallback in development when any API errors occur
    if (process.env.NODE_ENV === 'development') {
        // Check if the error is a network error or method not allowed (405)
        return (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_BAD_REQUEST' ||  // Handles 405 Method Not Allowed errors
            error.response?.status === 405 ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Network Error') ||
            error.message?.includes('Connection refused')
        );
    }
    return false;
};
