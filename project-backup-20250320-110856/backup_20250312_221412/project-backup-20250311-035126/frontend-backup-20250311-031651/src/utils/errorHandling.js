/**
 * Handles API errors consistently across the application
 * @param {Error|Object} error - The error object from the API call
 * @returns {Error} - A standardized error object
 */
export const handleApiError = (error) => {
    // If it's already an Error instance, just return it
    if (error instanceof Error) {
        return error;
    }

    // If it's a response object with a message
    if (error.message) {
        return new Error(error.message);
    }

    // If it's a response object with an error property
    if (error.error) {
        return new Error(typeof error.error === 'string' ? error.error : JSON.stringify(error.error));
    }

    // Default generic error
    return new Error('An unexpected error occurred');
};

/**
 * Formats validation errors from the API into a user-friendly format
 * @param {Object} validationErrors - The validation errors object from the API
 * @returns {string} - A formatted error message
 */
export const formatValidationErrors = (validationErrors) => {
    if (!validationErrors || typeof validationErrors !== 'object') {
        return 'Validation failed';
    }

    const errorMessages = Object.entries(validationErrors)
        .map(([field, errors]) => {
            const fieldName = field.replace(/_/g, ' ');
            const errorList = Array.isArray(errors) ? errors : [errors];
            return `${fieldName}: ${errorList.join(', ')}`;
        });

    return errorMessages.join('\n');
};

/**
 * Handles form submission errors
 * @param {Error|Object} error - The error from form submission
 * @param {Function} setError - Function to set the error state
 * @param {Function} setFieldErrors - Function to set field-specific errors
 */
export const handleFormError = (error, setError, setFieldErrors = null) => {
    if (!error) return;

    // If it's a validation error with field-specific errors
    if (error.validationErrors && setFieldErrors) {
        setFieldErrors(error.validationErrors);
        setError('Please correct the errors below');
        return;
    }

    // Set a general error message
    setError(error.message || 'An error occurred while submitting the form');
};

/**
 * Creates a timeout promise that rejects after the specified time
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} - A promise that rejects after the timeout
 */
export const timeout = (ms) => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    });
};

/**
 * Wraps a fetch promise with a timeout
 * @param {Promise} fetchPromise - The fetch promise
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} - A promise that resolves with the fetch result or rejects with a timeout error
 */
export const fetchWithTimeout = (fetchPromise, ms = 10000) => {
    return Promise.race([fetchPromise, timeout(ms)]);
};

/**
 * Logs errors to the console and potentially to a monitoring service
 * @param {Error} error - The error to log
 * @param {string} context - The context in which the error occurred
 */
export const logError = (error, context = '') => {
    console.error(`[${context}]`, error);

    // Here you could add integration with error monitoring services like Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { tags: { context } });
    // }
};
