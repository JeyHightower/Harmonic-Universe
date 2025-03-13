import React from 'react';

// Safety patch for React components
export const withSafetyWrapper = (Component) => {
    return class SafetyWrapper extends React.Component {
        state = { hasError: false, error: null };

        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }

        componentDidCatch(error, info) {
            console.error('Component Error:', error);
            console.error('Error Info:', info);
        }

        render() {
            if (this.state.hasError) {
                return (
                    <div className="error-boundary">
                        <h2>Something went wrong.</h2>
                        <details>
                            <summary>Error Details</summary>
                            <pre>{this.state.error?.toString()}</pre>
                        </details>
                    </div>
                );
            }

            return <Component {...this.props} />;
        }
    };
};

// Safe state hook
export const useSafeState = (initialState) => {
    const mounted = React.useRef(false);
    const [state, setState] = React.useState(initialState);

    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const setSafeState = React.useCallback((value) => {
        if (mounted.current) {
            setState(value);
        }
    }, []);

    return [state, setSafeState];
};

// Safe effect hook
export const useSafeEffect = (effect, deps) => {
    const mounted = React.useRef(false);

    React.useEffect(() => {
        mounted.current = true;
        let cleanup;

        if (mounted.current) {
            cleanup = effect();
        }

        return () => {
            mounted.current = false;
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, deps);
};

export default {
    withSafetyWrapper,
    useSafeState,
    useSafeEffect
};
