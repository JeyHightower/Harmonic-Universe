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

/**
 * Parses a date string into a Date object
 * @param {string} dateString - The date string to parse
 * @param {string} format - The expected format (for possible future implementation)
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDate = (dateString, format = null) => {
    if (!dateString) return null;

    try {
        // For now, we just use the built-in Date parser
        // In the future, we could implement custom format parsing if needed
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return null;
        }
        
        return date;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

/**
 * Calculates the difference in days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date (defaults to current date)
 * @returns {number|null} Number of days difference or null if invalid input
 */
export const getDaysDifference = (date1, date2 = new Date()) => {
    if (!date1) return null;

    try {
        // Convert to Date objects if they are strings
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        // Check if dates are valid
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            return null;
        }
        
        // Calculate difference in milliseconds and convert to days
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    } catch (error) {
        console.error('Error calculating days difference:', error);
        return null;
    }
};
