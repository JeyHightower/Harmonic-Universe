import { fetchUniverses } from '../store/thunks/universeThunks';
import { message } from 'antd';
import store from '../store';

/**
 * Utility to refresh universe data
 * This can be called directly from components without needing a modal
 *
 * @param {Object} options - Options for the refresh
 * @param {Function} options.onSuccess - Callback to call on successful refresh
 * @param {Function} options.onError - Callback to call on error
 * @param {boolean} options.showNotification - Whether to show a notification (default: true)
 * @returns {Promise<void>}
 */
export const refreshUniverses = async (options = {}) => {
    const {
        onSuccess,
        onError,
        showNotification = true
    } = options;

    try {
        if (showNotification) {
            message.loading({ content: 'Refreshing universe data...', key: 'refresh' });
        }

        // Dispatch the fetch universes action
        await store.dispatch(fetchUniverses()).unwrap();

        if (showNotification) {
            message.success({
                content: 'Universe data refreshed successfully!',
                key: 'refresh',
                duration: 2
            });
        }

        // Call success callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
        }
    } catch (error) {
        console.error('Error refreshing universe data:', error);

        if (showNotification) {
            message.error({
                content: 'Failed to refresh universe data. Please try again.',
                key: 'refresh',
                duration: 3
            });
        }

        // Call error callback if provided
        if (onError && typeof onError === 'function') {
            onError(error);
        }
    }
};

export default {
    refreshUniverses
};
