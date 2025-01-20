// Error handling utilities for consistent error management across the application

/**
 * Formats an error response from the API into a user-friendly message
 * @param {Error|Object|string} error - The error to format
 * @returns {string} A user-friendly error message
 */
export const formatApiError = error => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle axios error objects
  if (error.response) {
    const { status, data } = error.response;

    // Handle specific status codes
    switch (status) {
      case 400:
        return data.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return data.message || 'Invalid input. Please check your data.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred.';
    }
  }

  // Handle network errors
  if (error.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle other error objects
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Creates an async thunk error handler for Redux
 * @param {string} actionType - The base action type (e.g., 'auth/login')
 * @returns {Object} Object containing error handler and action creator
 */
export const createAsyncThunkHandler = actionType => ({
  pending: `${actionType}/pending`,
  fulfilled: `${actionType}/fulfilled`,
  rejected: `${actionType}/rejected`,

  // Helper for handling rejected state
  handleRejected: (state, action) => {
    state.isLoading = false;
    state.error = formatApiError(action.error);
  },

  // Helper for handling pending state
  handlePending: state => {
    state.isLoading = true;
    state.error = null;
  },

  // Helper for handling fulfilled state
  handleFulfilled: state => {
    state.isLoading = false;
    state.error = null;
  },
});

/**
 * Wraps an async function with error handling
 * @param {Function} asyncFn - The async function to wrap
 * @param {Object} options - Options for error handling
 * @returns {Promise} The wrapped function result
 */
export const withErrorHandling = async (asyncFn, options = {}) => {
  const { onError, rethrow = false, context = 'operation' } = options;

  try {
    return await asyncFn();
  } catch (error) {
    const formattedError = formatApiError(error);

    if (onError) {
      onError(formattedError);
    }

    console.error(`Error during ${context}:`, error);

    if (rethrow) {
      throw new Error(formattedError);
    }

    return { error: formattedError };
  }
};
