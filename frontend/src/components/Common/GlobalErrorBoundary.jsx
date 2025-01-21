import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  logError,
} from '../../services/errorLogging';
import styles from './GlobalErrorBoundary.module.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastError: null,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastError: error,
      recoveryAttempts: 0,
    }));

    logError(
      error,
      'React Component',
      ERROR_CATEGORIES.BUSINESS_LOGIC,
      this.isErrorCritical() ? ERROR_SEVERITY.CRITICAL : ERROR_SEVERITY.ERROR
    );

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  isErrorCritical() {
    const { errorCount, lastError, error } = this.state;
    return (
      errorCount > 3 || // Multiple errors occurred
      (lastError && error && lastError.message === error.message) || // Same error repeating
      error?.message?.includes('memory') || // Memory-related errors
      error?.message?.includes('stack overflow') // Stack overflow errors
    );
  }

  reportError(error, errorInfo) {
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      location: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      // Add user context if available
      user: this.props.user
        ? {
            id: this.props.user.id,
            email: this.props.user.email,
          }
        : null,
    };

    // Send to your error tracking service
    console.error('Error Report:', errorReport);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReset = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });

    // Reload the page
    window.location.reload();
  };

  renderErrorMessage() {
    const { error, errorInfo, recoveryAttempts } = this.state;
    const isCritical = this.isErrorCritical();

    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>{isCritical ? '🚨' : '⚠️'}</div>
          <h1 className={styles.errorTitle}>
            {isCritical ? 'Critical Error' : 'Something went wrong'}
          </h1>
          <p className={styles.errorMessage}>
            {error?.message || 'An unexpected error occurred'}
          </p>
          {this.props.showDetails && (
            <details className={styles.errorDetails}>
              <summary>Technical Details</summary>
              <pre>{errorInfo?.componentStack}</pre>
            </details>
          )}
          <div className={styles.errorActions}>
            {!isCritical && recoveryAttempts < 3 && (
              <button onClick={this.handleRetry} className={styles.retryButton}>
                Try Again
              </button>
            )}
            <button onClick={this.handleReset} className={styles.resetButton}>
              Reset Application
            </button>
            {this.props.supportEmail && (
              <a
                href={`mailto:${
                  this.props.supportEmail
                }?subject=Error Report&body=${encodeURIComponent(
                  `Error: ${error?.message}\n\nStack: ${errorInfo?.componentStack}`
                )}`}
                className={styles.supportLink}
              >
                Contact Support
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorMessage();
    }

    return this.props.children;
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  showDetails: PropTypes.bool,
  supportEmail: PropTypes.string,
  onRetry: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
  }),
};

GlobalErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
  supportEmail: 'support@example.com',
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(GlobalErrorBoundary);
