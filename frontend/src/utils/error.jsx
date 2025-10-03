/**
 * Utility function to handle API errors consistently
 * @param {Error} error - The error object to handle
 * @returns {Object} Formatted error object
 */
export const handleError = (error) => {
  console.error('API Error:', error);
  // Format error to ensure we don't return a complex object that could be accidentally rendered
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
  return {
    message: errorMessage,
    status: error.response?.status || 500,
    // Only include essential data, not the full response which might be complex
    data:
      typeof error.response?.data === 'string'
        ? error.response?.data
        : error.response?.data?.error || errorMessage,
  };
};
