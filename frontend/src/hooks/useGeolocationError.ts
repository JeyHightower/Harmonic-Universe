import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface GeolocationError extends Error {
  code?: number;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
  details?: any;
}

interface UseGeolocationErrorOptions {
  context: string;
  onError?: (error: GeolocationError) => void;
  onPermissionDenied?: (error: GeolocationError) => void;
  onPositionUnavailable?: (error: GeolocationError) => void;
  onTimeout?: (error: GeolocationError) => void;
}

/**
 * Custom hook for handling geolocation errors consistently across the application
 */
export function useGeolocationError({
  context,
  onError,
  onPermissionDenied,
  onPositionUnavailable,
  onTimeout,
}: UseGeolocationErrorOptions) {
  const handleError = useCallback(
    (error: GeolocationError) => {
      // Create a standardized error object
      const geolocationError: GeolocationError = {
        name: error.name || 'GeolocationError',
        message: error.message || 'A geolocation error occurred',
        code: error.code,
        PERMISSION_DENIED: error.PERMISSION_DENIED,
        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
        TIMEOUT: error.TIMEOUT,
        details: error.details,
      };

      // Log the error using our error service
      errorService.handleError(geolocationError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific geolocation error cases
      if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
        // Handle permission denied errors
        if (onPermissionDenied) {
          onPermissionDenied(geolocationError);
        }
        return;
      }

      if (geolocationError.code === geolocationError.POSITION_UNAVAILABLE) {
        // Handle position unavailable errors
        if (onPositionUnavailable) {
          onPositionUnavailable(geolocationError);
        }
        return;
      }

      if (geolocationError.code === geolocationError.TIMEOUT) {
        // Handle timeout errors
        if (onTimeout) {
          onTimeout(geolocationError);
        }
        return;
      }

      // Handle specific error codes
      switch (geolocationError.code) {
        case 1: // PERMISSION_DENIED
          // Handle permission denied
          break;
        case 2: // POSITION_UNAVAILABLE
          // Handle position unavailable
          break;
        case 3: // TIMEOUT
          // Handle timeout
          break;
        case 4: // UNKNOWN_ERROR
          // Handle unknown error
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(geolocationError);
      }
    },
    [context, onError, onPermissionDenied, onPositionUnavailable, onTimeout]
  );

  const isGeolocationError = useCallback((error: any): boolean => {
    return (
      error.name === 'GeolocationError' ||
      error.code?.toString().startsWith('GEO_') ||
      error.message?.toLowerCase().includes('geolocation') ||
      error.message?.toLowerCase().includes('location')
    );
  }, []);

  const isPermissionError = useCallback((error: any): boolean => {
    return (
      error.code === 1 ||
      error.code === error.PERMISSION_DENIED ||
      error.message?.toLowerCase().includes('permission') ||
      error.message?.toLowerCase().includes('denied')
    );
  }, []);

  const isPositionError = useCallback((error: any): boolean => {
    return (
      error.code === 2 ||
      error.code === error.POSITION_UNAVAILABLE ||
      error.message?.toLowerCase().includes('position') ||
      error.message?.toLowerCase().includes('unavailable')
    );
  }, []);

  const isTimeoutError = useCallback((error: any): boolean => {
    return (
      error.code === 3 ||
      error.code === error.TIMEOUT ||
      error.message?.toLowerCase().includes('timeout')
    );
  }, []);

  const getErrorMessage = useCallback((error: GeolocationError): string => {
    switch (error.code) {
      case 1:
        return 'Location permission denied. Please enable location services.';
      case 2:
        return 'Location information unavailable. Please try again.';
      case 3:
        return 'Location request timed out. Please try again.';
      case 4:
        return 'An unknown error occurred while getting location.';
      default:
        return error.message || 'A geolocation error occurred';
    }
  }, []);

  return {
    handleError,
    isGeolocationError,
    isPermissionError,
    isPositionError,
    isTimeoutError,
    getErrorMessage,
  };
} 