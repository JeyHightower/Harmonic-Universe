/**
 * React Fixes Module
 * This module exports utilities that help with React compatibility and browser extension issues
 */

// Re-export individual fixes
export * from './extensionState.js';
export * from './heuristicsRedefinitions.js';
export * from './utils.js';

// Import our pointer events fix but don't auto-apply it
import { applyEssentialFixes } from '../interactionFixes.mjs';

// Export the react-fix-loader functionality for direct imports
import './react-fix-loader.js';

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

  // Fix pointer events issues for modals - use a more conservative approach
  if (typeof window !== 'undefined') {
    try {
      // Ensure basic pointer events work
      document.body.style.pointerEvents = 'auto';

      // Apply essential fixes using our utility
      if (document.readyState === 'complete') {
        // Only apply fixes when DOM is ready
        setTimeout(() => {
          applyEssentialFixes();
        }, 300);
      } else {
        // Wait for DOM to be ready
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            applyEssentialFixes();
          }, 300);
        });
      }
    } catch (err) {
      console.error('Error applying pointer-events fixes:', err);
    }
  }

  return true;
}

// Helper to fix pointer events - simplified to avoid aggressive DOM manipulation
function fixPointerEvents() {
  // Ensure portal root has correct pointer events
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.pointerEvents = 'auto';
  }

  // Make modal elements interactive
  document.querySelectorAll('.modal-overlay, .modal-content, .modal-body').forEach((el) => {
    el.style.pointerEvents = 'auto';
  });

  console.log('Applied basic pointer-events fixes');
}

export default applyReactFixes;
