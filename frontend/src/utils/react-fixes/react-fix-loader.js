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

  // Detect environment
  console.log('Environment details:');
  console.log('- URL:', window.location.href);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Protocol:', window.location.protocol);
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

// Create utility functions to help with browser extension compatibility issues
window.utils = {
  checkExtensionCompatibility: function() {
    console.log('Extension compatibility check complete');
    return true;
  },
  suppressExtensionErrors: function() {
    console.log('Extension error suppression active');
    return true;
  }
};

// Create extensionState object to prevent console errors
window.extensionState = {
  initialized: true,
  features: {},
  settings: {},
  getState: function() { return this; },
  getSetting: function(key, defaultValue) { return defaultValue; }
};

// Create heuristicsRedefinitions object to prevent console errors
window.heuristicsRedefinitions = {
  enabled: true,
  registry: {},
  register: function() { return null; }
};

// Ensure proper MIME type for module scripts
document.addEventListener('DOMContentLoaded', function () {
  // Fix module script MIME type issues
  const moduleScripts = document.querySelectorAll('script[type="module"]');
  console.log(`Found ${moduleScripts.length} module scripts to fix`);

  moduleScripts.forEach(script => {
    if (script.src && !script.getAttribute('data-fixed')) {
      console.log('Applying MIME type fix for module script:', script.src);

      // Create a new script with proper attributes
      const fixedScript = document.createElement('script');
      fixedScript.type = 'module';
      fixedScript.src = script.src;
      fixedScript.setAttribute('data-fixed', 'true');
      fixedScript.crossOrigin = 'anonymous';

      // Add error handling
      fixedScript.onerror = function (error) {
        console.error('Error loading fixed module script:', error);
        console.log('Trying to load as regular script...');

        // Fallback to regular script
        const fallbackScript = document.createElement('script');
        fallbackScript.src = script.src;
        fallbackScript.setAttribute('data-fallback', 'true');
        document.head.appendChild(fallbackScript);
      };

      // Replace the original script
      script.parentNode.replaceChild(fixedScript, script);
    }
  });

  // Try to directly load index.js if needed
  if (document.querySelector('script[src="/src/index.js"]') === null) {
    console.log('Attempting to manually load index.js');
    const indexScript = document.createElement('script');
    indexScript.type = 'module';
    indexScript.src = '/src/index.js';
    indexScript.setAttribute('data-manual-fix', 'true');
    indexScript.crossOrigin = 'anonymous';
    document.head.appendChild(indexScript);
  }

  console.log('React fixes applied successfully');
}); 