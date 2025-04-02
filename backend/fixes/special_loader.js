/**
 * Special module loader for Harmonic Universe
 * 
 * This script helps load JavaScript modules properly when MIME type issues occur.
 * It detects module script errors and provides fallback loading mechanisms.
 */

(function () {
  // Check if already initialized to prevent multiple initializations
  if (window.__HU_MODULE_LOADER_INITIALIZED__) {
    console.log("🔄 Special module loader already initialized, skipping");
    return;
  }

  // Set initialization flag
  window.__HU_MODULE_LOADER_INITIALIZED__ = true;

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

  // Function to safely make API requests with error handling
  function safeApiFetch(url, options = {}) {
    return fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .catch(error => {
        console.warn(`⚠️ API request to ${url} failed:`, error.message);
        // Return a default response object to prevent cascading errors
        return {
          error: true,
          message: error.message,
          endpoint: url,
          fallback: true
        };
      });
  }

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
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log("✅ React already loaded");
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Try loading from local path first
      console.log("⚠️ React not found, trying local scripts...");

      const localReactScript = document.createElement('script');
      localReactScript.src = '/js/react.production.min.js';
      localReactScript.onload = () => {
        console.log("✅ Local React core loaded successfully");
        const localReactDOMScript = document.createElement('script');
        localReactDOMScript.src = '/js/react-dom.production.min.js';
        localReactDOMScript.onload = () => {
          console.log("✅ Local ReactDOM loaded successfully");
          resolve();
        };
        localReactDOMScript.onerror = loadFromCDN;
        document.head.appendChild(localReactDOMScript);
      };
      localReactScript.onerror = loadFromCDN;
      document.head.appendChild(localReactScript);

      function loadFromCDN() {
        console.warn("⚠️ Local React scripts not found, loading from CDN");

        // Load React from CDN
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
        reactScript.crossOrigin = 'anonymous';
        reactScript.onload = () => {
          console.log("✅ CDN React core loaded successfully");
          const reactDomScript = document.createElement('script');
          reactDomScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
          reactDomScript.crossOrigin = 'anonymous';
          reactDomScript.onload = () => {
            console.log("✅ CDN ReactDOM loaded successfully");
            resolve();
          };
          reactDomScript.onerror = createPolyfill;
          document.head.appendChild(reactDomScript);
        };
        reactScript.onerror = createPolyfill;
        document.head.appendChild(reactScript);
      }

      function createPolyfill() {
        console.warn("⚠️ Failed to load React from CDN, creating basic polyfill");

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

        resolve();
      }
    });
  }

  // Function to initialize diagnostic tests
  function runDiagnostics() {
    console.log("🔍 Running diagnostics...");

    // Check whitenoise configuration 
    safeApiFetch('/api/debug/whitenoise')
      .then(data => {
        if (!data.error) {
          console.log("✅ WhiteNoise diagnostic:", data);
        }
      });

    // Check MIME type handling
    safeApiFetch('/api/debug/mime-test')
      .then(data => {
        if (!data.error) {
          console.log("✅ MIME type diagnostic:", data);
        }
      });
  }

  // Ensure React is available
  ensureReact().then(() => {
    // Add global access to the module loader
    window.__HU_MODULE_LOADER__ = {
      loadFallbackScript,
      generateFakeModule,
      ensureReact,
      safeApiFetch,
      runDiagnostics
    };

    console.log("✅ Special module loader ready");

    // Run diagnostics if we're in a browser environment with a DOM
    if (typeof document !== 'undefined') {
      // Run diagnostics after a short delay to allow other scripts to load
      setTimeout(runDiagnostics, 1000);
    }
  });
})(); 