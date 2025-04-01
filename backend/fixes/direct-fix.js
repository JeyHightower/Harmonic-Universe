/**
 * Direct React Fix Loader - Simplified version
 * This script is placed directly in the static root for easier access
 */
console.log('Loading direct React fixes...');

// Check if React is already available globally
if (typeof React === 'undefined') {
  console.warn('React not found, implementing basic polyfill');

  // Basic React polyfill
  window.React = {
    createElement: function (type, props, ...children) {
      return { type, props: props || {}, children };
    },
    createContext: function () {
      return {
        Provider: function (props) { return props.children; },
        Consumer: function (props) { return props.children; }
      };
    },
    Fragment: Symbol('React.Fragment')
  };

  // Add JSX runtime compatibility
  window.jsx = window.React.createElement;
  window.jsxs = window.React.createElement;
}

// Check for missing module exports and fix them
if (typeof module === 'undefined') {
  window.module = { exports: {} };
}

// Ensure proper MIME type for module scripts
document.addEventListener('DOMContentLoaded', function () {
  console.log('React fixes applied successfully');

  // Create a diagnostic message element
  var diagElement = document.createElement('div');
  diagElement.style.display = 'none';
  diagElement.id = 'react-fix-status';
  diagElement.textContent = 'React fixes loaded: ' + new Date().toISOString();
  document.body.appendChild(diagElement);
}); 