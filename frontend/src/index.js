// Import the dynamic-import utility first to ensure require is polyfilled
import './utils/dynamic-import';

// Import React fixes
import "./utils/ensure-react-dom";
import "./utils/ensure-router-provider";
import "./utils/ensure-redux-provider";
import "./utils/react-diagnostics";

// Global error handler added for production
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error caught:", message, "at", source, lineno, colno);
  console.error("Error object:", error);

  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML = '<div style="color:red; padding:20px;">' +
      '<h2>Application Error</h2>' +
      '<p>' + message + '</p>' +
      '<p>Please try refreshing the page or contact support.</p>' +
      '</div>';
  }

  return true; // Prevents default error handling
};

// Explicitly import React and ReactDOM
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Explicitly make ReactDOM available globally
if (window && !window.ReactDOM) {
  window.ReactDOM = createRoot;
  console.log('[Index] Made ReactDOM available globally:', window.ReactDOM.version);
}

// Global store import using async/await with the safeImport utility
import { safeImport } from './utils/dynamic-import';

// Initialize store as null and load it asynchronously
let store = null;
(async function loadStore() {
  try {
    const storeModule = await safeImport('./store');
    store = storeModule.default;
    console.log('[Store] Redux store loaded successfully');

    // Dispatch an initialization action if needed
    if (store && store.dispatch) {
      store.dispatch({ type: 'app/initialized' });
    }
  } catch (error) {
    console.error('[Store] Failed to load Redux store:', error);
  }
})();

// Simple initialization logger
console.log('[INIT] Application initialization started');

// Simple promise rejection handler
window.addEventListener('unhandledrejection', function (event) {
  console.error('Unhandled promise rejection:', event.reason);
});

// Fix React Context error #321
if (React.createContext) {
  console.log('[INIT] React.createContext is available');
} else {
  console.error('[INIT] React.createContext not available, app may not work correctly');
}

// Fix ReactDOM.createRoot
if (!window.ReactDOM || !window.ReactDOM.createRoot) {
  console.error('[INIT] ReactDOM.createRoot not available, app may not work correctly');
}

// Double-check that we have React and ReactDOM in the window
if (!window.React) window.React = React;
if (!window.ReactDOM) window.ReactDOM = createRoot;

// Entry point for initialization
function initializeApp() {
  console.log('[INIT] Initializing application...');

  const init = () => {
    try {
      const rootElement = document.getElementById('root');
      if (!rootElement) {
        console.error('[INIT] Root element not found');
        return;
      }

      console.log('[INIT] Creating React root');
      let root;
      try {
        // Use the newer ReactDOM.createRoot API if available
        if (window.ReactDOM.createRoot) {
          root = window.ReactDOM.createRoot(rootElement);
        } else {
          // Fallback to legacy render method
          console.warn('[INIT] ReactDOM.createRoot not available, using legacy render');
          createRoot(rootElement).render(
            React.createElement(
              React.StrictMode,
              null,
              React.createElement(App)
            )
          );
          return;
        }
      } catch (error) {
        console.error('[INIT] Error creating root, falling back to legacy render:', error);
        try {
          // Final fallback to legacy render
          createRoot(rootElement).render(
            React.createElement(
              React.StrictMode,
              null,
              React.createElement(App)
            )
          );
          return;
        } catch (legacyError) {
          console.error('[INIT] Legacy render also failed:', legacyError);
          rootElement.innerHTML =
            '<div style="padding: 20px; text-align: center; font-family: system-ui;">' +
            '<h2 style="color: #ff4d4f;">React Rendering Error</h2>' +
            '<p>' + (error.message || 'Unable to render React application') + '</p>' +
            '<p>ReactDOM version: ' + (window.ReactDOM.version || 'unknown') + '</p>' +
            '<button onclick="window.location.reload()" ' +
            'style="padding: 8px 16px; margin-top: 15px; background: #1890ff; color: white; ' +
            'border: none; border-radius: 4px; cursor: pointer;">' +
            'Reload Application' +
            '</button>' +
            '</div>';
          return;
        }
      }

      // Create modal root if needed
      const modalRoot = document.getElementById('modal-root');
      if (!modalRoot) {
        const newModalRoot = document.createElement('div');
        newModalRoot.id = 'modal-root';
        document.body.appendChild(newModalRoot);
        console.log('[INIT] Created modal root element');
      }

      // Render the app with more direct approach to avoid context errors
      try {
        console.log('[INIT] Rendering React app...');
        root.render(
          React.createElement(
            React.StrictMode,
            null,
            React.createElement(App)
          )
        );
      } catch (error) {
        console.error('[INIT] Error rendering app with createRoot:', error);
        // Try fallback render as a last resort
        try {
          console.log('[INIT] Attempting fallback render...');
          createRoot(rootElement).render(
            React.createElement(
              React.StrictMode,
              null,
              React.createElement(App)
            )
          );
        } catch (error2) {
          console.error('[INIT] Fatal error in fallback render:', error2);
          rootElement.innerHTML =
            '<div style="padding: 20px; text-align: center; font-family: system-ui;">' +
            '<h2 style="color: #ff4d4f;">Initialization Error</h2>' +
            '<p>' + error2.message + '</p>' +
            '<button onclick="window.location.reload()" ' +
            'style="padding: 8px 16px; margin-top: 15px; background: #1890ff; color: white; ' +
            'border: none; border-radius: 4px; cursor: pointer;">' +
            'Reload Application' +
            '</button>' +
            '</div>';
        }
      }

      console.log('[INIT] DOM content loaded, initialization complete');
    } catch (error) {
      console.error('[INIT] Fatal initialization error:', error);
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.innerHTML =
          '<div style="padding: 20px; text-align: center; font-family: system-ui;">' +
          '<h2 style="color: #ff4d4f;">Initialization Error</h2>' +
          '<p>' + error.message + '</p>' +
          '<button onclick="window.location.reload()" ' +
          'style="padding: 8px 16px; margin-top: 15px; background: #1890ff; color: white; ' +
          'border: none; border-radius: 4px; cursor: pointer;">' +
          'Reload Application' +
          '</button>' +
          '</div>';
      }
    }
  };

  // If the DOM is already loaded, initialize immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    // Otherwise wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', init);
  }
}

// Start the application
initializeApp();
