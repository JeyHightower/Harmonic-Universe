import { useCallback, useState } from "react";
import { withErrorHandling } from "../utils/errorHandling";

/**
 * Custom hook for managing loading states and errors in async operations
 * @param {Object} options - Configuration options
 * @returns {Object} Loading state utilities
 */
const useLoadingState = (options = {}) => {
  const {
    initialLoading = false,
    initialError = null,
    onError: customErrorHandler,
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);

  /**
   * Wraps an async operation with loading state management
   * @param {Function} asyncFn - The async function to execute
   * @param {Object} asyncOptions - Options for error handling
   * @returns {Promise} The result of the async operation
   */
  const withLoading = useCallback(
    async (asyncFn, asyncOptions = {}) => {
      const { onSuccess, onError, context = "operation" } = asyncOptions;

      setIsLoading(true);
      setError(null);

      const result = await withErrorHandling(asyncFn, {
        onError: (error) => {
          setError(error);
          if (onError) onError(error);
          if (customErrorHandler) customErrorHandler(error);
        },
        context,
      });

      setIsLoading(false);

      if (!result.error && onSuccess) {
        onSuccess(result);
      }

      return result;
    },
    [customErrorHandler],
  );

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Sets a new error message
   * @param {string} message - The error message to set
   */
  const setErrorMessage = useCallback((message) => {
    setError(message);
  }, []);

  /**
   * Retries the last failed operation
   * @param {Function} retryFn - The function to retry
   * @returns {Promise} The result of the retry operation
   */
  const retry = useCallback(
    async (retryFn) => {
      if (typeof retryFn === "function") {
        clearError();
        return withLoading(retryFn);
      }
    },
    [clearError, withLoading],
  );

  return {
    isLoading,
    error,
    withLoading,
    clearError,
    setErrorMessage,
    retry,
  };
};

export default useLoadingState;
