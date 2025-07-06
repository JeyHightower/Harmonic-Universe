/**
 * Utilities Module
 * Centralized exports for utility functions used throughout the application
 */

// Configuration
export { CACHE_CONFIG } from './cacheConfig';
export { API_CONFIG, AUTH_CONFIG, FORCE_DEMO_MODE, IS_PRODUCTION, MODAL_CONFIG } from './config';
export { ROUTES } from './routes';

// API and Data Utilities
export { apiUtils } from './apiUtils';
export { cache, clearCache, invalidateCache } from './cache';
export { log, logError, logInfo, logWarning } from './logger';

// Date and Time Utilities
export { formatDate, getDaysDifference, parseDate } from './dateUtils';

// Validation Utilities
export * from './validation';

// UI Utilities
export * from './browserUtils';
export { default as classNames } from './classnames-shim';
export { ensureReduxProvider } from './ensure-redux-provider.jsx';
export { ensureRouterProvider } from './ensure-router-provider';
export { ensurePortalRoot } from './portalUtils';
export * from './themeUtils';

// Modal Registry
export {
  getModalComponent,
  registerModalComponent as registerModal,
  unregisterModalComponent as unregisterModal,
} from './modalRegistry';

// Visualization Utilities
export * from './visualizerUtils';

// Dynamic Import Helper
export { loadComponent } from './dynamic-import.jsx';
