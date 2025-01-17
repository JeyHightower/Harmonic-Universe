export const logError = (error, context = '') => {
    console.error(`Error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  };

  export const handleApiError = (error) => {
    if (error.response) {
      // Server responded with error
      return {
        type: 'API_ERROR',
        message: error.response.data.message || 'Server error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error - please check your connection',
      };
    } else {
      // Error in request setup
      return {
        type: 'REQUEST_ERROR',
        message: 'Error in setting up request',
      };
    }
  };
