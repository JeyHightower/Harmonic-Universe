/**
 * useAuthInit.mjs - Custom React hook for initializing authentication state.
 * Manages token validation, user fetching, refresh, and unauthorized redirects.
 *
 * @module useAuthInit
 * @exports {function} useAuthInit
 *
 * @description
 * This hook initializes auth on app/component mount:
 * - Checks/validates tokens from storage.
 * - Fetches user data if valid.
 * - Refreshes tokens if expiring soon.
 * - Handles errors and redirects via callbacks.
 *
 * Integrates with useAuthError for logging auth issues.
 *
 * @example
 * import React, { useEffect } from 'react';
 * import { useNavigate } from 'react-router-dom';
 * import AppRoutes from './routes';  // Your routes component
 * import { useAuthInit } from './hooks';  // Via barrel
 *
 * function App() {
 *   const navigate = useNavigate();
 *   const { initAuth, isInitialized, isAuthenticated } = useAuthInit({
 *     tokenKey: 'authToken',
 *     onUnauthorized: () => navigate('/login'),
 *   });
 *
 *   useEffect(() => {
 *     initAuth();
 *   }, [initAuth]);
 *
 *   if (!isInitialized) {
 *     return <div>Loading authentication...</div>;
 *   }
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" replace />;
 *   }
 *
 *   return <AppRoutes />;
 * }
 */

import React, { useState, useEffect, useCallback } from 'react';

// Import related hook for error handling (from barrel to avoid circular imports)
import { useAuthError } from './index.mjs';  // Via barrel; or './useAuthError.mjs' if direct

/**
 * Default options for the hook.
 */
const DEFAULT_OPTIONS = {
  tokenKey: 'authToken',           // Key for localStorage
  refreshEndpoint: '/api/auth/refresh',  // API for token refresh
  userEndpoint: '/api/user',       // API for fetching user data
  expirationBuffer: 5 * 60 * 1000, // 5 minutes before expiry to refresh (ms)
  enableRefresh: true,             // Enable auto-refresh
  storage: typeof window !== 'undefined' ? localStorage : null,  // Storage (SSR-safe)
};

/**
 * Simple AuthContext for global auth state (optional - use your state manager if preferred).
 * Provides user, isAuthenticated, and logout to child components.
 */
const AuthContext = React.createContext({
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

/**
 * Custom hook: useAuthInit
 *
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.tokenKey='authToken'] - Storage key for token.
 * @param {string} [options.refreshEndpoint='/api/auth/refresh'] - Refresh token API.
 * @param {string} [options.userEndpoint='/api/user'] - User data API.
 * @param {number} [options.expirationBuffer=300000] - Buffer before expiry (ms).
 * @param {boolean} [options.enableRefresh=true] - Auto-refresh tokens.
 * @param {Storage} [options.storage=localStorage] - Storage mechanism.
 * @param {Function} [options.onUnauthorized] - Callback on invalid auth (e.g., redirect).
 * @param {Function} [options.onSuccess] - Callback on successful init.
 *
 * @returns {Object} Hook return value.
 * @returns {Function} initAuth - Initializes auth (async: validate token, fetch user, refresh if needed).
 * @returns {boolean} isInitialized - True after init completes (success or failure).
 * @returns {boolean} isAuthenticated - True if valid token and user loaded.
 * @returns {Object|null} user - User data (e.g., { id, email, roles }).
 * @returns {Function} logout - Clears tokens and calls onUnauthorized.
 * @returns {Component} AuthProvider - Optional context provider for global auth state.
 */
export function useAuthInit(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser ] = useState(null);

  // Get auth error handler
  const { handleError: handleAuthError } = useAuthError({
    context: 'auth-init',
  });

  // JWT decode utility (simple base64 decode - use jwt-decode lib for production)
  const decodeToken = useCallback((token) => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      payload.exp = payload.exp * 1000;  // Convert to ms
      return payload;
    } catch (error) {
      handleAuthError(error, { severity: 'warn', context: 'token-decode' });
      return null;
    }
  }, [handleAuthError]);

  // Get token from storage (SSR-safe)
  const getToken = useCallback(() => {
    if (!config.storage) return null;
    return config.storage.getItem(config.tokenKey);
  }, [config]);

  // Set token in storage
  const setToken = useCallback((token) => {
    if (!config.storage) return;
    if (token) {
      config.storage.setItem(config.tokenKey, token);
    } else {
      config.storage.removeItem(config.tokenKey);
    }
  }, [config]);

  // Fetch user data (with auth header)
  const fetchUser  = useCallback(async (token) => {
    if (!token) return null;

    try {
      const response = await fetch(config.userEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`User  fetch failed: ${response.status}`);
      }

      const userData = await response.json();
      setUser (userData);
      return userData;
    } catch (error) {
      handleAuthError(error, { severity: 'error', context: 'fetch-user' });
      return null;
    }
  }, [config.userEndpoint, handleAuthError]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!config.enableRefresh || !config.storage) return null;

    try {
      const response = await fetch(config.refreshEndpoint, {
        method: 'POST',
        credentials: 'include',  // For cookies if needed
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const { token: newToken } = await response.json();
      setToken(newToken);
      return newToken;
    } catch (error) {
      handleAuthError(error, { severity: 'error', context: 'token-refresh' });
      return null;
    }
  }, [config, setToken, handleAuthError]);

  // Validate token: Check expiry and refresh if needed
  const validateToken = useCallback(async (token, depth = 0) => {
    if (depth > 3) return false;  // Prevent infinite recursion

    if (!token) return false;

    const decoded = decodeToken(token);
    if (!decoded) return false;

    const now = Date.now();
    const isExpired = decoded.exp < now;
    const willExpireSoon = decoded.exp < (now + config.expirationBuffer);

    if (isExpired) {
      // Token expired - try refresh
      const newToken = await refreshToken();
      if (newToken) {
        return await validateToken(newToken, depth + 1);  // Recursive check
      }
      return false;
    }

    if (willExpireSoon) {
      // Proactively refresh (non-blocking)
      refreshToken().catch((error) => {
        handleAuthError(error, { severity: 'warn', context: 'proactive-refresh' });
      });
    }

    return true;
  }, [decodeToken, refreshToken, config.expirationBuffer, handleAuthError]);

  // Logout: Clear state and storage
  const logout = useCallback(() => {
    setToken(null);
    setUser (null);
    setIsAuthenticated(false);
    if (config.onUnauthorized) {
      config.onUnauthorized();
    }
  }, [setToken, config.onUnauthorized]);

  // Main init function (async)
  const initAuth = useCallback(async () => {
    if (isInitialized) return;  // Prevent re-init

    try {
      const token = getToken();
      if (!token) {
        setIsInitialized(true);
        if (config.onUnauthorized) config.onUnauthorized();
        return;
      }

      const isValid = await validateToken(token);
      if (isValid) {
        const userData = await fetchUser (token);
        if (userData) {
          setIsAuthenticated(true);
          if (config.onSuccess) config.onSuccess(userData);
        } else {
          logout();  // Invalid user data
        }
      } else {
        logout();  // Invalid token
      }

      setIsInitialized(true);
    } catch (error) {
      handleAuthError(error, { severity: 'error', context: 'auth-init' });
      setIsInitialized(true);
      logout();
    }
  }, [isInitialized, getToken, validateToken, fetchUser , logout, config, handleAuthError]);

  // Listen for storage changes (multi-tab sync)
  useEffect(() => {
    if (!config.storage) return;

    const handleStorageChange = (e) => {
      if (e.key === config.tokenKey) {
        const newToken = e.newValue;
        if (!newToken) {
          logout();
        } else {
          initAuth();  // Re-init on token change
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [config.tokenKey, logout, initAuth]);

  // Initial load effect (runs once on mount)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Optional AuthProvider for context
  const AuthProvider = ({ children }) => (
    <AuthContext.Provider value={{ user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );

  // Expose public API
  return {
    initAuth,
    isInitialized,
    isAuthenticated,
    user,
    logout,
    AuthProvider,
  };
}

// Optional: Custom hook to consume the context
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
