import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorService from '../utils/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error using our error service
    errorService.handleError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We apologize for the inconvenience. Please try refreshing the page.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Error Details</summary>
              {this.state.error.toString()}
              <br />
              {this.state.error.stack}
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 