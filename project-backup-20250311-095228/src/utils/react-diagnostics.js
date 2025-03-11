// React Diagnostics Utility
import React from 'react';

// Diagnostic logger for React components
export const logComponentRender = (componentName, props) => {
    console.log(`[React Diagnostic] ${componentName} rendered with props:`, props);
};

// Performance monitoring
export const measureRenderTime = (Component) => {
    return function WrappedComponent(props) {
        const startTime = performance.now();
        const result = React.createElement(Component, props);
        const endTime = performance.now();
        console.log(`[React Diagnostic] ${Component.name} render time: ${endTime - startTime}ms`);
        return result;
    };
};

// Error boundary diagnostic wrapper
export class DiagnosticBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[React Diagnostic] Error caught by boundary:', {
            error,
            errorInfo,
            component: this.props.componentName || 'Unknown'
        });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || <div>Component Error: Check console for details.</div>;
        }
        return this.props.children;
    }
}

// Hook usage diagnostic
export const useComponentDiagnostic = (componentName) => {
    React.useEffect(() => {
        console.log(`[React Diagnostic] ${componentName} mounted`);
        return () => console.log(`[React Diagnostic] ${componentName} unmounted`);
    }, [componentName]);
};

// State change tracker
export const createDiagnosticState = (initialState, name = 'Component') => {
    return function useDiagnosticState() {
        const [state, setState] = React.useState(initialState);

        const setStateWithLogging = React.useCallback((newState) => {
            console.log(`[React Diagnostic] ${name} state changing:`, {
                from: state,
                to: typeof newState === 'function' ? newState(state) : newState
            });
            setState(newState);
        }, [state, name]);

        return [state, setStateWithLogging];
    };
};

// Context diagnostic wrapper
export const createDiagnosticContext = (Context, name = 'Context') => {
    return {
        Provider: ({ children, value }) => {
            console.log(`[React Diagnostic] ${name} Provider value:`, value);
            return React.createElement(Context.Provider, { value }, children);
        },
        Consumer: ({ children }) => {
            return React.createElement(Context.Consumer, null, (value) => {
                console.log(`[React Diagnostic] ${name} Consumer received:`, value);
                return children(value);
            });
        }
    };
};

// Ref diagnostic wrapper
export const createDiagnosticRef = (name = 'Component') => {
    const ref = React.createRef();
    return Object.defineProperty(ref, 'current', {
        get() {
            console.log(`[React Diagnostic] ${name} ref accessed`);
            return ref._current;
        },
        set(value) {
            console.log(`[React Diagnostic] ${name} ref set to:`, value);
            ref._current = value;
        }
    });
};

// Export diagnostic utilities
export const ReactDiagnostics = {
    logComponentRender,
    measureRenderTime,
    DiagnosticBoundary,
    useComponentDiagnostic,
    createDiagnosticState,
    createDiagnosticContext,
    createDiagnosticRef
};
