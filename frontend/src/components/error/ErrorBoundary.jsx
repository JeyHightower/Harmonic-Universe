import React, { Component } from "react";
import PropTypes from "prop-types";
import { logError } from "../../utils/logger";
import "./ErrorBoundary.css";

// Simple error service if the imported one isn't available
const errorService = {
  handleError: (error, source, info) => {
    console.error(`Error in ${source}:`, error, info);
    logError(error, source, info);
  }
};

// Define a fallback for process.env if it's not available in the environment
const processEnv = typeof process !== 'undefined' && process.env ? process.env : { NODE_ENV: 'development' };

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error using our error service
    errorService.handleError(error, "ErrorBoundary", {
      componentStack: errorInfo.componentStack,
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          {processEnv.NODE_ENV === "development" && this.state.error && (
            <details style={{ whiteSpace: "pre-wrap" }}>
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

// PropTypes for type checking
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func,
};

export default ErrorBoundary;
