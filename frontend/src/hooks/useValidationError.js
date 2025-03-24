import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

/**
 * Custom hook for handling validation errors in API responses consistently across the application
 */
export function useValidationError({
  context,
  onError,
  onFieldError,
  onGlobalError,
}) {
  const handleError = useCallback(
    (response) => {
      // Log the validation errors using our error service
      errorService.handleError(
        new Error(response.message || 'Validation failed'),
        context,
        { errors: response.errors }
      );

      // Handle field-specific errors
      response.errors.forEach(error => {
        if (onFieldError) {
          onFieldError(error.field, error);
        }
      });

      // Handle global error message if present
      if (response.message && onGlobalError) {
        onGlobalError(response.message);
      }

      // Call the onError callback if provided
      if (onError) {
        onError(response.errors);
      }
    },
    [context, onError, onFieldError, onGlobalError]
  );

  const isValidationError = useCallback((error) => {
    return (
      error.name === 'ValidationError' ||
      error.status === 400 ||
      error.code?.startsWith('VALIDATION_') ||
      error.message?.toLowerCase().includes('validation') ||
      error.message?.toLowerCase().includes('invalid') ||
      Array.isArray(error.errors)
    );
  }, []);

  const getFieldError = useCallback(
    (errors, field) => {
      return errors.find(error => error.field === field);
    },
    []
  );

  const hasFieldError = useCallback(
    (errors, field) => {
      return errors.some(error => error.field === field);
    },
    []
  );

  const getFieldErrors = useCallback(
    (errors, field) => {
      return errors.filter(error => error.field === field);
    },
    []
  );

  const getGlobalError = useCallback(
    (errors) => {
      return errors.find(error => !error.field)?.message;
    },
    []
  );

  const clearFieldError = useCallback(
    (errors, field) => {
      return errors.filter(error => error.field !== field);
    },
    []
  );

  const clearAllErrors = useCallback(() => {
    return [];
  }, []);

  const formatErrorMessage = useCallback(
    (error) => {
      if (!error.field) {
        return error.message;
      }
      return `${error.field}: ${error.message}`;
    },
    []
  );

  const formatErrorList = useCallback(
    (errors) => {
      return errors.map(formatErrorMessage);
    },
    [formatErrorMessage]
  );

  return {
    handleError,
    isValidationError,
    getFieldError,
    hasFieldError,
    getFieldErrors,
    getGlobalError,
    clearFieldError,
    clearAllErrors,
    formatErrorMessage,
    formatErrorList,
  };
} 