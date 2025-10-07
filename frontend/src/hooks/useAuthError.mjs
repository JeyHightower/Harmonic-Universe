import { useCallback } from 'react';
import ErrorService from '../services/error.service.mjs'
// Safe import for errorService (fallback if file doesn't exist yet)
let errorService;
try {
} catch (importError) {
  console.warn('[useAuthError] errorService not found - falling back to console logging:', importError);
  errorService = {
    handleError: (error, context, metadata) => {
      console.error(`[AuthError:${context}]`, error, metadata);
    }
  };
}

/**
 * Custom hook for handling authentication errors consistently across the application.
 *
 * @module useAuthError
 * @exports {function} useAuthError
 *
 * @description
 * Provides standardized auth error handling:
 * - Logs errors via errorService (or console fallback).
 * - Handles specific HTTP codes (401, 403) and auth error codes (e.g., TOKEN_EXPIRED).
 * - Classifies errors (auth, session, MFA, password) for conditional logic.
 * - Safe for calls without options (defaults provided).
 *
 * @param {Object} [options] - Configuration options (optional).
 * @param {string} [options.context='auth'] - Error context (e.g., 'login', 'token-refresh').
 * @param {Function} [options.onError] - General error callback.
 * @param {Function} [options.onUnauthorized] - 401 unauthorized callback (e.g., redirect to login).
 * @param {Function} [options.onForbidden] - 403 forbidden callback (e.g., show permissions error).
 * @param {Function} [options.onSessionExpired] - Session/token expired callback (e.g., refresh or logout).
 *
 * @returns {Object} Hook return value.
 * @returns {Function} handleError - Processes and handles an error (logs, calls callbacks).
 * @returns {Function} isAuthError - Checks if error is auth-related.
 * @returns {Function} isSessionError - Checks if error is session/token-related.
 * @returns {Function} isMfaError - Checks if error is MFA-related.
 * @returns {Function} isPasswordError - Checks if error is password-related.
 *
 * @example
 * // Safe call with options (recommended)
 * const { handleError } = useAuthError({
 *   context: 'login',
 *   onUnauthorized: () => navigate('/login')
 * });
 *
 * // Safe call without options (uses defaults)
 * const { handleError } = useAuthError();
 *
 * // Usage in try/catch
 * try {
 *   // API call
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useAuthError(options = {}) {
  // Safe destructuring with defaults (prevents 'undefined' error)
  const {
    context = 'auth',
    onError = () => {},
    onUnauthorized = () => {},
    onForbidden = () => {},
    onSessionExpired = () => {}
  } = options || {};

  const handleError = useCallback(
    (error) => {
      // Ensure context is defined
      const finalContext = context || 'unknown';

      // Create a standardized error object
      const authError = {
        name: error.name || 'AuthError',
        message: error.message || 'An authentication error occurred',
        code: error.code,
        status: error.status || (error.response?.status || null),
        details: error.details,
      };

      // Log the error using our error service (or fallback)
      errorService.handleError(authError, finalContext, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific authentication error cases
      if (authError.status === 401) {
        // Handle unauthorized access
        onUnauthorized();
        return authError;
      }

      if (authError.status === 403) {
        // Handle forbidden access
        onForbidden();
        return authError;
      }

      if (authError.code === 'SESSION_EXPIRED') {
        // Handle session expiration
        onSessionExpired();
        return authError;
      }

      // Handle specific error codes
      switch (authError.code) {
        case 'INVALID_CREDENTIALS':
          // Handle invalid credentials (e.g., show error message)
          break;
        case 'ACCOUNT_LOCKED':
          // Handle account locked (e.g., notify user)
          break;
        case 'ACCOUNT_DISABLED':
          // Handle account disabled
          break;
        case 'INVALID_TOKEN':
          // Handle invalid token (e.g., clear storage)
          break;
        case 'TOKEN_EXPIRED':
          // Handle token expiration (e.g., attempt refresh)
          break;
        case 'MFA_REQUIRED':
          // Handle MFA requirement (e.g., redirect to MFA page)
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
          // Handle unknown error codes (e.g., generic toast)
          break;
      }

      // Call the onError callback if provided
      onError(authError);

      return authError;  // Return for chaining
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
