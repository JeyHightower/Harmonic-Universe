/**
 * Formats a date string into a human-readable format
 * @param {string} dateString - The date string to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        // Default options
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        };

        return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error';
    }
};

/**
 * Returns a relative time string (e.g., "2 days ago", "just now")
 * @param {string} dateString - The date string to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        const now = new Date();

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const diffInSeconds = Math.floor((date - now) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays < -365) {
            return formatDate(dateString); // More than a year ago, use full date
        } else if (diffInDays < -30) {
            return rtf.format(Math.floor(diffInDays / 30), 'month');
        } else if (diffInDays < -1) {
            return rtf.format(diffInDays, 'day');
        } else if (diffInHours < -1) {
            return rtf.format(diffInHours, 'hour');
        } else if (diffInMinutes < -1) {
            return rtf.format(diffInMinutes, 'minute');
        } else if (diffInSeconds < -10) {
            return rtf.format(diffInSeconds, 'second');
        } else {
            return 'just now';
        }
    } catch (error) {
        console.error('Error calculating relative time:', error);
        return 'Error';
    }
};
