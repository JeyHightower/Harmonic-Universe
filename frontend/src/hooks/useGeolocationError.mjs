import { useCallback } from "react";
import errorService from "../services/errorService";
import { APP_CONFIG } from "../utils/config";

/**
 * Custom hook for handling geolocation errors consistently across the application
 */
export function useGeolocationError({
  context,
  onError,
  onPermissionDenied,
  onPositionUnavailable,
  onTimeout,
}) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const geolocationError = {
        name: error.name || "GeolocationError",
        message: error.message || "A geolocation error occurred",
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

      // Call the onError callback if provided
      if (onError) {
        onError(geolocationError);
      }
    },
    [context, onError, onPermissionDenied, onPositionUnavailable, onTimeout]
  );

  const isGeolocationError = useCallback((error) => {
    return (
      error.name === "GeolocationError" ||
      error.code === error.PERMISSION_DENIED ||
      error.code === error.POSITION_UNAVAILABLE ||
      error.code === error.TIMEOUT ||
      error.message?.toLowerCase().includes("geolocation")
    );
  }, []);

  const isPermissionError = useCallback((error) => {
    return (
      error.code === error.PERMISSION_DENIED ||
      error.message?.toLowerCase().includes("permission denied")
    );
  }, []);

  const isPositionError = useCallback((error) => {
    return (
      error.code === error.POSITION_UNAVAILABLE ||
      error.message?.toLowerCase().includes("position unavailable")
    );
  }, []);

  const isTimeoutError = useCallback((error) => {
    return (
      error.code === error.TIMEOUT ||
      error.message?.toLowerCase().includes("timeout")
    );
  }, []);

  const getErrorMessage = useCallback((error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Please enable location services in your browser settings.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please check your device settings and try again.";
      case error.TIMEOUT:
        return "Location request timed out. Please check your internet connection and try again.";
      default:
        return (
          error.message || "An error occurred while getting your location."
        );
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
