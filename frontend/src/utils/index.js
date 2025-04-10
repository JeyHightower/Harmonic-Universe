/**
 * Utilities Module
 * Centralized exports for utility functions used throughout the application
 */

// Configuration
export { AUTH_CONFIG, API_CONFIG, IS_PRODUCTION } from './config';
export { ROUTES } from './routes';
export { CACHE_CONFIG } from './cacheConfig';

// API and Data Utilities
export { cache, clearCache, invalidateCache } from './cache';
export { apiUtils } from './apiUtils';
export { log, logError, logWarning, logInfo } from './logger';

// Date and Time Utilities
export { formatDate, parseDate, getDaysDifference } from './dateUtils';

// Validation Utilities
export * from './validation';
export * from './errorHandling';

// UI Utilities
export { ensurePortalRoot } from './portalUtils';
export { ensureReduxProvider } from './ensure-redux-provider';
export { ensureRouterProvider } from './ensure-router-provider';
export * from './browserUtils';
export * from './themeUtils';
export { default as classNames } from './classnames-shim';

// Modal Registry
export { registerModal, unregisterModal, getModalComponent } from './modalRegistry';

// Visualization Utilities
export * from './visualizerUtils';

// Authentication Utilities
export * from './authFallback';

// Dynamic Import Helper
export { loadComponent } from './dynamic-import';

// Versioning
export { version } from './version';
