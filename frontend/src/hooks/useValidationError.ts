import { useCallback } from 'react';
import errorService from '../utils/errorService';
import { APP_CONFIG } from '../utils/config';

interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

interface ValidationResponse {
  errors: ValidationError[];
  message?: string;
  code?: string;
}

interface UseValidationErrorOptions {
  context: string;
  onError?: (errors: ValidationError[]) => void;
  onFieldError?: (field: string, error: ValidationError) => void;
  onGlobalError?: (message: string) => void;
}

/**
 * Custom hook for handling validation errors in API responses consistently across the application
 */
export function useValidationError({
  context,
  onError,
  onFieldError,
  onGlobalError,
}: UseValidationErrorOptions) {
  const handleError = useCallback(
    (response: ValidationResponse) => {
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

  const isValidationError = useCallback((error: any): boolean => {
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
    (errors: ValidationError[], field: string): ValidationError | undefined => {
      return errors.find(error => error.field === field);
    },
    []
  );

  const hasFieldError = useCallback(
    (errors: ValidationError[], field: string): boolean => {
      return errors.some(error => error.field === field);
    },
    []
  );

  const getFieldErrors = useCallback(
    (errors: ValidationError[], field: string): ValidationError[] => {
      return errors.filter(error => error.field === field);
    },
    []
  );

  const getGlobalError = useCallback(
    (errors: ValidationError[]): string | undefined => {
      return errors.find(error => !error.field)?.message;
    },
    []
  );

  const clearFieldError = useCallback(
    (errors: ValidationError[], field: string): ValidationError[] => {
      return errors.filter(error => error.field !== field);
    },
    []
  );

  const clearAllErrors = useCallback((): ValidationError[] => {
    return [];
  }, []);

  const formatErrorMessage = useCallback(
    (error: ValidationError): string => {
      if (!error.field) {
        return error.message;
      }
      return `${error.field}: ${error.message}`;
    },
    []
  );

  const formatErrorList = useCallback(
    (errors: ValidationError[]): string[] => {
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