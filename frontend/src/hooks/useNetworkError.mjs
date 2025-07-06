import { useCallback, useEffect, useState } from 'react';
import errorService from '../services/error.service.mjs';

/**
 * Custom hook for handling network errors consistently across the application
 */
export function useNetworkError({
  context,
  onError,
  onOffline,
  onOnline,
  retryCount = 3,
  retryDelay = 1000,
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onOnline) {
        onOnline();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onOffline) {
        onOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  const handleError = useCallback(
    async (error, retryFn) => {
      // Create a standardized error object
      const networkError = {
        name: error.name || 'NetworkError',
        message: error.message || 'A network error occurred',
        code: error.code,
        status: error.status,
        details: error.details,
      };

      // Log the error using our error service
      errorService.handleError(networkError, context, {
        timestamp: new Date().toISOString(),
        isOnline,
        retryAttempts,
      });

      // Handle specific network error cases
      if (!isOnline) {
        // Handle offline state
        if (onOffline) {
          onOffline();
        }
        return;
      }

      if (networkError.status === 0) {
        // Handle CORS or network connectivity issues
        if (retryFn && retryAttempts < retryCount) {
          await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
          setRetryAttempts((prev) => prev + 1);
          return retryFn();
        }
        return;
      }

      if (networkError.status === 408) {
        // Handle timeout errors
        if (retryFn && retryAttempts < retryCount) {
          await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
          setRetryAttempts((prev) => prev + 1);
          return retryFn();
        }
        return;
      }

      if (networkError.status >= 500) {
        // Handle server errors
        if (retryFn && retryAttempts < retryCount) {
          await new Promise((resolve) => window.setTimeout(resolve, retryDelay));
          setRetryAttempts((prev) => prev + 1);
          return retryFn();
        }
        return;
      }

      // Handle specific error codes
      switch (networkError.code) {
        case 'NETWORK_ERROR':
          // Handle general network errors
          break;
        case 'TIMEOUT_ERROR':
          // Handle timeout errors
          break;
        case 'CORS_ERROR':
          // Handle CORS errors
          break;
        case 'DNS_ERROR':
          // Handle DNS errors
          break;
        case 'SSL_ERROR':
          // Handle SSL errors
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(networkError);
      }
    },
    [context, onError, onOffline, isOnline, retryAttempts, retryCount, retryDelay]
  );

  const isNetworkError = useCallback((error) => {
    return (
      error.name === 'NetworkError' ||
      error.status === 0 ||
      error.status === 408 ||
      error.code?.startsWith('NETWORK_') ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('timeout') ||
      error.message?.toLowerCase().includes('cors')
    );
  }, []);

  const isTimeoutError = useCallback((error) => {
    return (
      error.code === 'TIMEOUT_ERROR' ||
      error.status === 408 ||
      error.message?.toLowerCase().includes('timeout')
    );
  }, []);

  const isCorsError = useCallback((error) => {
    return (
      error.code === 'CORS_ERROR' ||
      error.message?.toLowerCase().includes('cors') ||
      error.message?.toLowerCase().includes('cross-origin')
    );
  }, []);

  const resetRetryAttempts = useCallback(() => {
    setRetryAttempts(0);
  }, []);

  return {
    isOnline,
    retryAttempts,
    handleError,
    isNetworkError,
    isTimeoutError,
    isCorsError,
    resetRetryAttempts,
  };
}
