import { useCallback } from "react";
import errorService from "../services/errorService";
import { APP_CONFIG } from "../utils/config";

// Define setTimeout for ESLint compatibility
const { setTimeout } = window;

/**
 * Custom hook for handling API errors consistently across the application
 */
export function useApiError({
  context,
  onError,
  retryCount = 3,
  retryDelay = 1000,
}) {
  const handleError = useCallback(
    async (error, retryFn) => {
      // Create a standardized error object
      const apiError = {
        name: error.name || "ApiError",
        message: error.message || "An unexpected error occurred",
        status: error.status,
        code: error.code,
        details: error.details,
      };

      // Log the error using our error service
      errorService.handleError(apiError, context, {
        retryCount,
        retryDelay,
      });

      // Handle specific error cases
      if (apiError.status === 401) {
        // Handle unauthorized access
        // You might want to redirect to login or refresh token
        return;
      }

      if (apiError.status === 403) {
        // Handle forbidden access
        return;
      }

      if (apiError.status === 404) {
        // Handle not found errors
        return;
      }

      if (apiError.status === 429) {
        // Handle rate limiting
        if (retryFn && retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return retryFn();
        }
        return;
      }

      if (apiError.status >= 500) {
        // Handle server errors
        if (retryFn && retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return retryFn();
        }
        return;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(apiError);
      }
    },
    [context, onError, retryCount, retryDelay]
  );

  const isNetworkError = useCallback((error) => {
    return (
      error.name === "NetworkError" ||
      error.message?.includes("network") ||
      error.message?.includes("timeout")
    );
  }, []);

  const isTimeoutError = useCallback((error) => {
    return (
      error.name === "TimeoutError" ||
      error.message?.includes("timeout") ||
      error.status === 408
    );
  }, []);

  const isValidationError = useCallback((error) => {
    return (
      error.name === "ValidationError" ||
      error.status === 400 ||
      error.message?.includes("validation")
    );
  }, []);

  return {
    handleError,
    isNetworkError,
    isTimeoutError,
    isValidationError,
  };
}
