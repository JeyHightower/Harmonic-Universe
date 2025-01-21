// Error severity levels
const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Error categories
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  API: 'api',
  WEBSOCKET: 'websocket',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATABASE: 'database',
  BUSINESS_LOGIC: 'business_logic',
  PERFORMANCE: 'performance',
  UNKNOWN: 'unknown',
};

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxStoredErrors = 100;
    this.analyticsEnabled = true;
    this.errorCallbacks = new Set();
  }

  trackError(
    error,
    context = '',
    category = ERROR_CATEGORIES.UNKNOWN,
    severity = ERROR_SEVERITY.ERROR
  ) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      category,
      severity,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...this.getPerformanceMetrics(),
      },
    };

    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.pop();
    }

    this.notifyErrorCallbacks(errorEntry);
    this.sendToAnalytics(errorEntry);

    console.error(
      `[${severity.toUpperCase()}] Error in ${context}:`,
      errorEntry
    );
  }

  getPerformanceMetrics() {
    const metrics = {};
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const memory = performance.memory;

      if (navigation) {
        metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
        metrics.domInteractive =
          navigation.domInteractive - navigation.startTime;
        metrics.backendTime = navigation.responseEnd - navigation.requestStart;
      }

      if (memory) {
        metrics.usedJSHeapSize = memory.usedJSHeapSize;
        metrics.totalJSHeapSize = memory.totalJSHeapSize;
      }
    }
    return metrics;
  }

  addErrorCallback(callback) {
    this.errorCallbacks.add(callback);
  }

  removeErrorCallback(callback) {
    this.errorCallbacks.delete(callback);
  }

  notifyErrorCallbacks(error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
  }

  sendToAnalytics(error) {
    if (!this.analyticsEnabled) return;

    // Here you would integrate with your analytics service
    // For example, Google Analytics, Sentry, or your custom analytics
    try {
      // Example integration with Google Analytics
      if (window.gtag) {
        window.gtag('event', 'error', {
          event_category: error.category,
          event_label: error.message,
          value: error.severity === ERROR_SEVERITY.CRITICAL ? 1 : 0,
        });
      }
    } catch (e) {
      console.error('Failed to send error to analytics:', e);
    }
  }

  getErrorStats() {
    return {
      total: this.errors.length,
      bySeverity: this.errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {}),
      byCategory: this.errors.reduce((acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  clearErrors() {
    this.errors = [];
  }
}

const errorTracker = new ErrorTracker();

export const logError = (
  error,
  context = '',
  category = ERROR_CATEGORIES.UNKNOWN,
  severity = ERROR_SEVERITY.ERROR
) => {
  errorTracker.trackError(error, context, category, severity);
};

export const handleApiError = error => {
  if (error.response) {
    // Server responded with error
    const errorData = {
      type: 'API_ERROR',
      message: error.response.data.message || 'Server error occurred',
      status: error.response.status,
    };
    errorTracker.trackError(
      new Error(errorData.message),
      'API Request',
      ERROR_CATEGORIES.API,
      error.response.status >= 500
        ? ERROR_SEVERITY.ERROR
        : ERROR_SEVERITY.WARNING
    );
    return errorData;
  } else if (error.request) {
    // Request made but no response
    const errorData = {
      type: 'NETWORK_ERROR',
      message: 'Network error - please check your connection',
    };
    errorTracker.trackError(
      new Error(errorData.message),
      'Network Request',
      ERROR_CATEGORIES.NETWORK,
      ERROR_SEVERITY.ERROR
    );
    return errorData;
  } else {
    // Error in request setup
    const errorData = {
      type: 'REQUEST_ERROR',
      message: 'Error in setting up request',
    };
    errorTracker.trackError(
      new Error(errorData.message),
      'Request Setup',
      ERROR_CATEGORIES.API,
      ERROR_SEVERITY.ERROR
    );
    return errorData;
  }
};

export const handleWebSocketError = (error, context = '') => {
  errorTracker.trackError(
    error,
    context || 'WebSocket',
    ERROR_CATEGORIES.WEBSOCKET,
    ERROR_SEVERITY.ERROR
  );
};

export const handleValidationError = (error, context = '') => {
  errorTracker.trackError(
    error,
    context || 'Validation',
    ERROR_CATEGORIES.VALIDATION,
    ERROR_SEVERITY.WARNING
  );
};

export const handleAuthError = (error, context = '') => {
  errorTracker.trackError(
    error,
    context || 'Authentication',
    ERROR_CATEGORIES.AUTHENTICATION,
    ERROR_SEVERITY.ERROR
  );
};

export const getErrorStats = () => errorTracker.getErrorStats();
export const clearErrors = () => errorTracker.clearErrors();
export const addErrorCallback = callback =>
  errorTracker.addErrorCallback(callback);
export const removeErrorCallback = callback =>
  errorTracker.removeErrorCallback(callback);

export { ERROR_CATEGORIES, ERROR_SEVERITY };
