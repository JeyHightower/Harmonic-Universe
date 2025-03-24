import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

interface UseApiErrorOptions {
  context: string;
  onError?: (error: ApiError) => void;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Custom hook for handling API errors consistently across the application
 */
export function useApiError({
  context,
  onError,
  retryCount = 3,
  retryDelay = 1000,
}: UseApiErrorOptions) {
  const handleError = useCallback(
    async (error: ApiError, retryFn?: () => Promise<any>) => {
      // Create a standardized error object
      const apiError: ApiError = {
        name: error.name || 'ApiError',
        message: error.message || 'An unexpected error occurred',
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
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return retryFn();
        }
        return;
      }

      if (apiError.status >= 500) {
        // Handle server errors
        if (retryFn && retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
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

  const isNetworkError = useCallback((error: any): boolean => {
    return (
      error.name === 'NetworkError' ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    );
  }, []);

  const isTimeoutError = useCallback((error: any): boolean => {
    return (
      error.name === 'TimeoutError' ||
      error.message?.includes('timeout') ||
      error.status === 408
    );
  }, []);

  const isValidationError = useCallback((error: any): boolean => {
    return (
      error.name === 'ValidationError' ||
      error.status === 400 ||
      error.message?.includes('validation')
    );
  }, []);

  return {
    handleError,
    isNetworkError,
    isTimeoutError,
    isValidationError,
  };
} 