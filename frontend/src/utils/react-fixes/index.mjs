/**
 * React Fixes Module
 * This module exports utilities that help with React compatibility and browser extension issues
 */

// Re-export individual fixes
export * from './extensionState.mjs';
export * from './heuristicsRedefinitions.mjs';
export * from './utils.mjs';

// Export the react-fix-loader functionality for direct imports
import './react-fix-loader.mjs';

// Export a function to initialize all fixes
export function applyReactFixes() {
  console.log('Applying React compatibility fixes');

  // Check if React is available globally
  if (typeof window.React === 'undefined') {
    console.warn('React not found, implementing basic polyfill');

    // This implements the same polyfill from react-fix-loader.js
    window.React = {
      createElement: function () {
        return { type: arguments[0], props: arguments[1] || {} };
      },
      createContext: function () {
        return {
          Provider: function (props) {
            return props.children;
          },
          Consumer: function (props) {
            return props.children;
          },
        };
      },
      Fragment: Symbol('React.Fragment'),
    };

    window.jsx = window.React.createElement;
    window.jsxs = window.React.createElement;
  }

  return true;
}

export default applyReactFixes;
