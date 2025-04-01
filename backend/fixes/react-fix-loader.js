/**
 * React Fix Loader - Resolves common React module loading issues
 * 
 * This script helps with:
 * 1. MIME type issues for module scripts
 * 2. Fixing missing React references
 * 3. Ensuring proper JSX runtime availability
 */

// Check if React is already available globally
if (typeof React === 'undefined') {
  console.warn('React not found, implementing basic polyfill');

  // Basic React polyfill
  window.React = {
    createElement: function () {
      return { type: arguments[0], props: arguments[1] || {} };
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

// Fix JSX runtime issues
if (!window.jsx || !window.jsxs) {
  window.jsx = window.React.createElement;
  window.jsxs = window.React.createElement;

  // Module compatibility
  if (typeof module !== 'undefined') {
    module.exports = {
      jsx: window.jsx,
      jsxs: window.jsxs,
      Fragment: window.React.Fragment
    };
  }
}

// Ensure proper MIME type for module scripts
document.addEventListener('DOMContentLoaded', function () {
  // Fix module script MIME type issues
  const moduleScripts = document.querySelectorAll('script[type="module"]');
  moduleScripts.forEach(script => {
    if (script.src && !script.getAttribute('data-fixed')) {
      console.log('Applying MIME type fix for module script:', script.src);

      // Create a new script with proper attributes
      const fixedScript = document.createElement('script');
      fixedScript.type = 'module';
      fixedScript.src = script.src;
      fixedScript.setAttribute('data-fixed', 'true');
      fixedScript.crossOrigin = 'anonymous';

      // Replace the original script
      script.parentNode.replaceChild(fixedScript, script);
    }
  });

  console.log('React fixes applied successfully');
}); 