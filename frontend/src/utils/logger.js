/**
 * Logger utility for production and development environments
 * This logger persists logs even in production builds and provides a way to view them
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize the global log store if it doesn't exist and we're in browser
if (isBrowser && !window.appLogs) {
    window.appLogs = {
        logs: [],
        enabled: true,
        maxLogs: 1000,
        categories: {
            modal: true,
            auth: true,
            api: true,
            general: true,
            error: true
        }
    };
}

// Check for debug mode from environment variables
const isDebugEnabled = isBrowser && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEBUG === 'true';

// Helper to determine if we're in production
const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

// Initialize with debug mode if enabled in environment
if (isBrowser && isDebugEnabled) {
    window.debugMode = true;
    console.log('Debug mode enabled via environment variable');
}

/**
 * Log an event to both the console and the persistent log store
 *
 * @param {string} category - The category of the log (modal, auth, api, etc.)
 * @param {string} message - The message to log
 * @param {object} data - Additional data to include in the log
 * @param {boolean} forceLog - Whether to log even if the category is disabled
 */
export const log = (category, message, data = {}, forceLog = false) => {
    // Skip logging in non-browser environments
    if (!isBrowser) {
        console.log(`[${category.toUpperCase()}] ${message}`, data);
        return;
    }

    // Create the log entry
    const entry = {
        time: new Date().toISOString(),
        category,
        message,
        data
    };

    // Always store the log in the global store
    if (window.appLogs.enabled && (window.appLogs.categories[category] || forceLog)) {
        window.appLogs.logs.push(entry);

        // Trim logs if we exceed the maximum
        if (window.appLogs.logs.length > window.appLogs.maxLogs) {
            window.appLogs.logs = window.appLogs.logs.slice(-window.appLogs.maxLogs);
        }
    }

    // Only log to console in development or if explicitly requested
    if (!isProduction || forceLog || window.debugMode) {
        const style = getLogStyle(category);
        console.log(`%c[${category.toUpperCase()}] ${message}`, style, data);
    }
};

/**
 * Log an error
 */
export const logError = (message, error, category = 'error') => {
    // In non-browser environment, just log to console
    if (!isBrowser) {
        console.error(`[${category.toUpperCase()}] ${message}`, error);
        return;
    }

    const data = {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
    };

    log(category, message, data, true);

    // In development, also log to console directly for better stack traces
    if (!isProduction) {
        console.error(`[${category.toUpperCase()}] ${message}`, error);
    }
};

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {object} data - Additional data
 * @param {string} category - The log category
 */
export const logWarning = (message, data = {}, category = 'warning') => {
    // In non-browser environment, just log to console
    if (!isBrowser) {
        console.warn(`[${category.toUpperCase()}] ${message}`, data);
        return;
    }

    log(category, `⚠️ ${message}`, data);
    
    if (!isProduction) {
        console.warn(`[${category.toUpperCase()}] ${message}`, data);
    }
};

/**
 * Log an informational message
 * @param {string} message - The info message
 * @param {object} data - Additional data
 * @param {string} category - The log category
 */
export const logInfo = (message, data = {}, category = 'info') => {
    // In non-browser environment, just log to console
    if (!isBrowser) {
        console.info(`[${category.toUpperCase()}] ${message}`, data);
        return;
    }

    log(category, `ℹ️ ${message}`, data);
    
    if (!isProduction) {
        console.info(`[${category.toUpperCase()}] ${message}`, data);
    }
};

/**
 * Get a CSS style for console logs based on category
 */
const getLogStyle = (category) => {
    switch (category) {
        case 'modal':
            return 'color: purple; font-weight: bold';
        case 'auth':
            return 'color: blue; font-weight: bold';
        case 'api':
            return 'color: green; font-weight: bold';
        case 'error':
            return 'color: red; font-weight: bold; background: #ffeeee';
        case 'warning':
            return 'color: orange; font-weight: bold; background: #fffaee';
        case 'info':
            return 'color: teal; font-weight: bold';
        default:
            return 'color: gray; font-weight: bold';
    }
};

/**
 * Create a logger for a specific category
 */
export const createLogger = (category) => ({
    log: (message, data) => log(category, message, data),
    error: (message, error) => logError(message, error, category),
    warn: (message, data) => logWarning(message, data, category),
    info: (message, data) => logInfo(message, data, category),
    success: (message, data) => log(category, `✅ ${message}`, data)
});

/**
 * Enable or disable logging for a category
 */
export const toggleLogging = (category, enabled = true) => {
    if (!isBrowser) return;

    if (category === 'all') {
        Object.keys(window.appLogs.categories).forEach(cat => {
            window.appLogs.categories[cat] = enabled;
        });
    } else {
        window.appLogs.categories[category] = enabled;
    }
};

/**
 * Enable debug mode (forces logging in production)
 */
export const enableDebugMode = () => {
    if (!isBrowser) return;

    window.debugMode = true;
    log('general', 'Debug mode enabled', {}, true);
};

/**
 * Get all logs for display
 */
export const getLogs = (category = null, limit = 100) => {
    if (!isBrowser) return [];

    let filteredLogs = window.appLogs.logs;

    if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    return filteredLogs.slice(-limit);
};

/**
 * Clear all logs
 */
export const clearLogs = () => {
    if (!isBrowser) return;

    window.appLogs.logs = [];
    log('general', 'Logs cleared', {}, true);
};

// Export pre-configured loggers
export const modalLogger = createLogger('modal');
export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');
export const generalLogger = createLogger('general');

// Create a default logger export with all functions
const Logger = {
  log,
  error: logError,
  logError,
  logInfo,
  logWarning,
  createLogger,
  toggleLogging,
  enableDebugMode,
  getLogs,
  clearLogs,
  modalLogger,
  authLogger,
  apiLogger,
  generalLogger
};

export default Logger;

// Create a global logging function for easy access
if (isBrowser) {
    window.appLog = log;
    window.enableDebugMode = enableDebugMode;

    // Initialize with debug mode enabled if URL has debug parameter
    if (window.location.search.includes('debug=true')) {
        enableDebugMode();
        log('general', 'Debug mode enabled via URL parameter', {}, true);
    }
}
