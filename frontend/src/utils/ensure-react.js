// Import React to make sure it's available
import React from 'react';

// Ensure React and createContext are globally available
if (typeof window !== 'undefined') {
    // Make sure React is globally available
    window.React = window.React || React;

    // Ensure createContext is available on React
    if (window.React && !window.React.createContext) {
        window.React.createContext = React.createContext;
    }

    console.log('[Ensure React] React is now globally available');
}

export default React;
