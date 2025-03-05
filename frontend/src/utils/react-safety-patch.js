import React from 'react';

// Create a direct reference to React context in module scope
const safeCreateContext = React.createContext;

// Ensure React and its methods are available globally
if (typeof window !== 'undefined') {
    // Assign or extend the global React
    window.React = window.React || React;

    // Ensure createContext specifically is available
    if (!window.React.createContext) {
        window.React.createContext = safeCreateContext;
    }

    // Create a fallback if somehow the real method is unavailable
    const originalCreateContext = window.React.createContext;
    window.React.createContext = function createContextWithFallback(defaultValue) {
        try {
            return originalCreateContext(defaultValue);
        } catch (e) {
            console.warn('Error in React.createContext, using fallback:', e);
            return {
                Provider: function ({ children }) { return children; },
                Consumer: function ({ children }) { return children(defaultValue); },
                _currentValue: defaultValue
            };
        }
    };

    // Create direct references to commonly used methods on window
    window.createReactContext = window.React.createContext;

    // Create direct references to specific contexts Ant might be looking for
    window.IconContext = window.IconContext || React.createContext({});

    console.log('[React Safety Patch] Applied React safety patches');
}

export default React;
