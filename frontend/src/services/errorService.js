import { MONITORING_CONFIG } from './config';

/**
 * Service for handling errors securely
 * Implements error boundaries, secure logging, and error reporting
 */
class ErrorService {
  private static instance: ErrorService;
  private errorCount: number = 0;
  private errorWindow: number = 60000; // 1 minute window
  private errorTimestamps: number[] = [];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Handle an error securely
   * @param {Error} error - The error to handle
   * @param {string} context - Context where the error occurred
   * @param {Object} additionalData - Additional error data
   */
  handleError(error: Error, context: string, additionalData: any = {}): void {
    // Sanitize error data
    const sanitizedError = this.sanitizeError(error);
    
    // Log error if within rate limit
    if (this.shouldLogError()) {
      this.logError(sanitizedError, context, additionalData);
    }

    // Report error if monitoring is enabled
    if (MONITORING_CONFIG.ENABLE_ERROR_MONITORING) {
      this.reportError(sanitizedError, context, additionalData);
    }

    // Update error tracking
    this.trackError();
  }

  /**
   * Sanitize error data to remove sensitive information
   * @param {Error} error - The error to sanitize
   * @returns {Object} Sanitized error data
   */
  private sanitizeError(error: Error): any {
    return {
      name: error.name,
      message: this.sanitizeMessage(error.message),
      stack: this.sanitizeStack(error.stack),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sanitize error message to remove sensitive data
   * @param {string} message - The error message
   * @returns {string} Sanitized message
   */
  private sanitizeMessage(message: string): string {
    // Remove potential sensitive data patterns
    return message
      .replace(/password/i, '[REDACTED]')
      .replace(/token/i, '[REDACTED]')
      .replace(/key/i, '[REDACTED]')
      .replace(/secret/i, '[REDACTED]')
      .replace(/credential/i, '[REDACTED]');
  }

  /**
   * Sanitize stack trace to remove sensitive information
   * @param {string} stack - The stack trace
   * @returns {string} Sanitized stack trace
   */
  private sanitizeStack(stack: string | undefined): string {
    if (!stack) return '';
    
    // Remove file paths and line numbers
    return stack
      .split('\n')
      .map(line => line.replace(/at\s+.*?\((.*?)\)/, 'at [REDACTED]'))
      .join('\n');
  }

  /**
   * Check if error should be logged based on rate limiting
   * @returns {boolean} True if error should be logged
   */
  private shouldLogError(): boolean {
    const now = Date.now();
    
    // Remove timestamps outside the window
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => now - timestamp < this.errorWindow
    );
    
    // Check if we're within rate limit
    return this.errorTimestamps.length < 100; // Max 100 errors per minute
  }

  /**
   * Log error securely
   * @param {Object} error - The sanitized error
   * @param {string} context - Error context
   * @param {Object} additionalData - Additional error data
   */
  private logError(error: any, context: string, additionalData: any): void {
    const logData = {
      error,
      context,
      additionalData: this.sanitizeData(additionalData),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', logData);
    }

    // Log to monitoring service if enabled
    if (MONITORING_CONFIG.ENABLE_ERROR_MONITORING) {
      this.sendToMonitoring(logData);
    }
  }

  /**
   * Sanitize additional data to remove sensitive information
   * @param {Object} data - The data to sanitize
   * @returns {Object} Sanitized data
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Report error to monitoring service
   * @param {Object} error - The error to report
   * @param {string} context - Error context
   * @param {Object} additionalData - Additional error data
   */
  private reportError(error: any, context: string, additionalData: any): void {
    // Only report if within sampling rate
    if (Math.random() > MONITORING_CONFIG.SAMPLE_RATE) {
      return;
    }

    const reportData = {
      error,
      context,
      additionalData: this.sanitizeData(additionalData),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.VITE_APP_VERSION,
    };

    this.sendToMonitoring(reportData);
  }

  /**
   * Send error data to monitoring service
   * @param {Object} data - The error data to send
   */
  private sendToMonitoring(data: any): void {
    // Implement your monitoring service integration here
    // Example: Sentry.captureException(data);
  }

  /**
   * Track error occurrence
   */
  private trackError(): void {
    this.errorCount++;
    this.errorTimestamps.push(Date.now());
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats(): any {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorTimestamps.length,
      window: this.errorWindow,
    };
  }

  /**
   * Reset error tracking
   */
  resetErrorTracking(): void {
    this.errorCount = 0;
    this.errorTimestamps = [];
  }
}

export default ErrorService.getInstance(); 