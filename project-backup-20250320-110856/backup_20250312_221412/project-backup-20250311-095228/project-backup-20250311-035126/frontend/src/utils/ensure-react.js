// Import React to make sure it's available
import React from 'react';

// Function to create a mock React context for icons
function createMockContext(defaultValue) {
    return {
        Provider: function (props) { return props.children; },
        Consumer: function (props) { return props.children ? props.children(defaultValue) : null; },
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        displayName: 'MockContext'
    };
}

// Ensure React and createContext are globally available
if (typeof window !== 'undefined') {
    // Make sure React is globally available
    window.React = window.React || React;

    // Ensure createContext is available on React
    if (window.React && !window.React.createContext) {
        window.React.createContext = React.createContext || createMockContext;
        console.log('[Ensure React] Added createContext method to React');
    }

    // Function to get React reference from various possible locations
    function getReactReference() {
        // Check global window.React
        if (window.React && window.React.createContext) {
            return window.React;
        }

        // Check imported React
        if (React && React.createContext) {
            return React;
        }

        // Check for aliases
        if (window.react && window.react.createContext) {
            return window.react;
        }

        // If nothing is found, create a minimal implementation
        console.warn('[Ensure React] Could not find valid React reference, creating minimal implementation');
        const minimalReact = {
            createElement: function () { return {}; },
            createContext: createMockContext,
            version: '16.8.0'
        };

        // Set it globally
        window.React = minimalReact;
        return minimalReact;
    }

    // Get a valid React reference
    const reactRef = getReactReference();

    // Set global icon context if needed
    window.IconContext = window.IconContext || reactRef.createContext({
        prefixCls: 'anticon',
        rtl: false
    });

    // Ensure version is set
    if (window.IconContext) {
        window.IconContext.version = window.IconContext.version || "4.2.1";
    }

    console.log('[Ensure React] React is now globally available with createContext:',
        !!window.React.createContext);

    // Create global helper for resolving contexts
    window.__resolveReactCreateContext = function () {
        return (window.React && window.React.createContext) || createMockContext;
    };
}

// Export our React reference
export default React;
