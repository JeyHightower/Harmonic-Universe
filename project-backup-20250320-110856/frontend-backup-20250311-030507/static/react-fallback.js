// React fallback components and error boundaries
import React from 'react';

// Fallback component for loading states
export function LoadingFallback() {
    return React.createElement('div', {
        className: 'react-fallback loading',
        style: {
            padding: '20px',
            textAlign: 'center',
            color: '#666'
        }
    }, 'Loading...');
}

// Error boundary component
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[React Error Boundary]', error, errorInfo);
        if (window.__RUNTIME_DIAGNOSTICS__) {
            window.__RUNTIME_DIAGNOSTICS__.log('errors', 'React Error Boundary', {
                error,
                errorInfo,
                component: this.props.name || 'Unknown'
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                className: 'react-error-boundary',
                style: {
                    padding: '20px',
                    margin: '10px',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                }
            }, [
                React.createElement('h3', { key: 'title' }, 'Something went wrong'),
                React.createElement('pre', { key: 'error' },
                    this.state.error && this.state.error.message
                ),
                React.createElement('button', {
                    key: 'retry',
                    onClick: () => this.setState({ hasError: false, error: null }),
                    style: {
                        marginTop: '10px',
                        padding: '5px 10px',
                        border: '1px solid #721c24',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: '#721c24',
                        cursor: 'pointer'
                    }
                }, 'Try Again')
            ]);
        }

        return this.props.children;
    }
}

// Suspense fallback component
export function SuspenseFallback() {
    return React.createElement('div', {
        className: 'react-suspense-fallback',
        style: {
            padding: '20px',
            textAlign: 'center',
            color: '#666'
        }
    }, [
        React.createElement('div', {
            key: 'spinner',
            className: 'loading-spinner',
            style: {
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }
        }),
        React.createElement('div', {
            key: 'text',
            style: { marginTop: '10px' }
        }, 'Loading content...')
    ]);
}

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
