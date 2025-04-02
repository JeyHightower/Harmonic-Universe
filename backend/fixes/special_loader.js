/**
 * Special module loader for Harmonic Universe
 * 
 * This script helps load JavaScript modules properly when MIME type issues occur.
 * It detects module script errors and provides fallback loading mechanisms.
 */

(function () {
  console.log("🔧 Special module loader initialized");

  // Store information about script errors
  const scriptErrors = new Map();

  // Create a global object to track loaded modules
  window.__HU_MODULES__ = window.__HU_MODULES__ || {};

  // Listen for script load errors
  window.addEventListener('error', function (event) {
    const target = event.target;

    // Only handle script errors
    if (target.tagName !== 'SCRIPT') return;

    const src = target.src || '';

    // Only handle module script errors
    if (target.type === 'module' || src.includes('/src/') || src.includes('index.js')) {
      console.warn(`⚠️ Module script error detected: ${src}`);
      scriptErrors.set(src, event);

      // Prevent error from showing in console
      event.preventDefault();

      // Try to load as regular script with special handling
      loadFallbackScript(src);
    }
  }, true);

  // Function to load a script as a regular script when module loading fails
  function loadFallbackScript(src) {
    console.log(`🔄 Loading fallback for: ${src}`);

    // Create a new script element
    const fallbackScript = document.createElement('script');
    fallbackScript.src = src;
    fallbackScript.onerror = function (event) {
      console.error(`❌ Fallback script load failed: ${src}`);

      // If fallback fails, generate a fake module
      generateFakeModule(src);
    };
    fallbackScript.onload = function () {
      console.log(`✅ Fallback script loaded: ${src}`);
    };

    // Add the script to the document
    document.head.appendChild(fallbackScript);
  }

  // Function to generate a fake module when all else fails
  function generateFakeModule(src) {
    console.log(`🔧 Generating fake module for: ${src}`);

    // Extract module name from src
    const moduleName = src.split('/').pop().split('.')[0];

    // Create a fake module
    window.__HU_MODULES__[moduleName] = {
      jsx: function (type, props) { return { type, props }; },
      jsxs: function (type, props) { return { type, props }; },
      Fragment: Symbol('Fragment'),
      default: { generated: true, source: src }
    };

    // Add these to the global scope
    window.jsx = window.__HU_MODULES__[moduleName].jsx;
    window.jsxs = window.__HU_MODULES__[moduleName].jsxs;
    window.Fragment = window.__HU_MODULES__[moduleName].Fragment;

    console.log(`✅ Fake module generated for: ${moduleName}`);
  }

  // Function to check if React is available and provide a polyfill if not
  function ensureReact() {
    if (typeof React === 'undefined') {
      console.warn("⚠️ React not found, loading from CDN");

      // Load React from CDN
      const reactScript = document.createElement('script');
      reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
      reactScript.crossOrigin = 'anonymous';
      document.head.appendChild(reactScript);

      const reactDomScript = document.createElement('script');
      reactDomScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
      reactDomScript.crossOrigin = 'anonymous';
      document.head.appendChild(reactDomScript);

      // Create a minimal React polyfill
      window.React = window.React || {
        createElement: function (type, props, ...children) {
          return { type, props: { ...props, children } };
        },
        Fragment: Symbol('Fragment')
      };

      window.ReactDOM = window.ReactDOM || {
        createRoot: function (container) {
          return {
            render: function (element) {
              container.innerHTML = '<div>React Polyfill Rendering</div>';
              console.log('React polyfill render:', element);
            }
          };
        }
      };
    }
  }

  // Ensure React is available
  ensureReact();

  // Add global access to the module loader
  window.__HU_MODULE_LOADER__ = {
    loadFallbackScript,
    generateFakeModule,
    ensureReact
  };

  console.log("✅ Special module loader ready");
})(); 