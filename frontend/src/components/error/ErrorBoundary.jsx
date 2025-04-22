import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // You can also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-container" style={errorContainerStyle}>
          <h2 style={headingStyle}>Something went wrong</h2>
          <p style={textStyle}>{this.state.error?.message || 'Unknown error'}</p>
          <details style={detailsStyle}>
            <summary style={summaryStyle}>Error Details</summary>
            <pre style={preStyle}>
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })} style={buttonStyle}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for the error boundary
const errorContainerStyle = {
  margin: '20px auto',
  padding: '20px',
  backgroundColor: '#fff8f8',
  border: '1px solid #ffb6b6',
  borderRadius: '4px',
  maxWidth: '700px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const headingStyle = {
  color: '#e53935',
  marginTop: 0,
};

const textStyle = {
  color: '#333',
};

const detailsStyle = {
  marginTop: '15px',
};

const summaryStyle = {
  cursor: 'pointer',
  color: '#e53935',
  fontWeight: 'bold',
};

const preStyle = {
  whiteSpace: 'pre-wrap',
  backgroundColor: '#f5f5f5',
  padding: '10px',
  borderRadius: '4px',
  overflow: 'auto',
  maxHeight: '200px',
};

const buttonStyle = {
  marginTop: '15px',
  padding: '8px 16px',
  backgroundColor: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
