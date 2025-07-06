import { useCallback } from 'react';
import errorService from '../services/error.service.mjs';

/**
 * Custom hook for handling authentication errors consistently across the application
 */
export function useAuthError({ context, onError, onUnauthorized, onForbidden, onSessionExpired }) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const authError = {
        name: error.name || 'AuthError',
        message: error.message || 'An authentication error occurred',
        code: error.code,
        status: error.status,
        details: error.details,
      };

      // Log the error using our error service
      errorService.handleError(authError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific authentication error cases
      if (authError.status === 401) {
        // Handle unauthorized access
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      if (authError.status === 403) {
        // Handle forbidden access
        if (onForbidden) {
          onForbidden();
        }
        return;
      }

      if (authError.code === 'SESSION_EXPIRED') {
        // Handle session expiration
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }

      // Handle specific error codes
      switch (authError.code) {
        case 'INVALID_CREDENTIALS':
          // Handle invalid credentials
          break;
        case 'ACCOUNT_LOCKED':
          // Handle account locked
          break;
        case 'ACCOUNT_DISABLED':
          // Handle account disabled
          break;
        case 'INVALID_TOKEN':
          // Handle invalid token
          break;
        case 'TOKEN_EXPIRED':
          // Handle token expiration
          break;
        case 'MFA_REQUIRED':
          // Handle MFA requirement
          break;
        case 'MFA_INVALID':
          // Handle invalid MFA
          break;
        case 'PASSWORD_EXPIRED':
          // Handle password expiration
          break;
        case 'PASSWORD_RESET_REQUIRED':
          // Handle password reset requirement
          break;
        default:
          // Handle unknown error codes
          break;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(authError);
      }
    },
    [context, onError, onUnauthorized, onForbidden, onSessionExpired]
  );

  const isAuthError = useCallback((error) => {
    return (
      error.name === 'AuthError' ||
      error.status === 401 ||
      error.status === 403 ||
      error.code?.startsWith('AUTH_') ||
      error.message?.toLowerCase().includes('auth') ||
      error.message?.toLowerCase().includes('unauthorized') ||
      error.message?.toLowerCase().includes('forbidden')
    );
  }, []);

  const isSessionError = useCallback((error) => {
    return (
      error.code === 'SESSION_EXPIRED' ||
      error.code === 'TOKEN_EXPIRED' ||
      error.message?.toLowerCase().includes('session') ||
      error.message?.toLowerCase().includes('token')
    );
  }, []);

  const isMfaError = useCallback((error) => {
    return (
      error.code === 'MFA_REQUIRED' ||
      error.code === 'MFA_INVALID' ||
      error.message?.toLowerCase().includes('mfa') ||
      error.message?.toLowerCase().includes('multi-factor')
    );
  }, []);

  const isPasswordError = useCallback((error) => {
    return (
      error.code === 'PASSWORD_EXPIRED' ||
      error.code === 'PASSWORD_RESET_REQUIRED' ||
      error.message?.toLowerCase().includes('password')
    );
  }, []);

  return {
    handleError,
    isAuthError,
    isSessionError,
    isMfaError,
    isPasswordError,
  };
}
