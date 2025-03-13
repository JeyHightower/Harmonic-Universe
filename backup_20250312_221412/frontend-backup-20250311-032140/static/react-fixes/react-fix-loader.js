// React Fix Loader
// This file contains critical fixes and polyfills for React

// Flag to indicate the loader has run
window.__REACT_FIX_LOADER_LOADED = true;

// Ensure React global exists
if (typeof window.React === 'undefined') {
    window.React = {};
}

// Enhanced createContext polyfill
if (window.React.createContext) {
    const originalCreateContext = window.React.createContext;
    window.React.createContext = function (defaultValue) {
        try {
            const context = originalCreateContext(defaultValue);
            // Ensure valid context properties
            if (context && context.Provider) {
                context.Provider.isReactComponent = true;
                if (typeof Symbol !== 'undefined') {
                    context.Provider.$$typeof = Symbol.for('react.element');
                }
            }
            return context;
        } catch (error) {
            console.warn('[React Fix Loader] Creating failsafe context');
            return {
                Provider: function (props) {
                    return props.children;
                },
                Consumer: function (props) {
                    return typeof props.children === 'function'
                        ? props.children(defaultValue)
                        : props.children;
                },
                _currentValue: defaultValue,
                _currentValue2: defaultValue,
            };
        }
    };
}

// Ensure basic React utilities exist
window.React = {
    ...window.React,
    Fragment: window.React.Fragment || function (props) { return props.children; },
    StrictMode: window.React.StrictMode || function (props) { return props.children; },
    Suspense: window.React.Suspense || function (props) { return props.children; },
    createElement: window.React.createElement || function () {
        throw new Error('React.createElement is not available');
    },
    cloneElement: window.React.cloneElement || function () {
        throw new Error('React.cloneElement is not available');
    }
};

// Log successful load
console.log('[React Fix Loader] Successfully loaded React fixes and polyfills');
