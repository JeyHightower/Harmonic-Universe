alert('MAIN.JSX IS LOADING');
console.error('MAIN.JSX ERROR TEST - THIS SHOULD SHOW');
console.log('MAIN.JSX LOADED');

// Debug environment detection
console.error('Environment check:', {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  mode: import.meta.env.MODE,
});

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import store, { persistor } from './store/store.mjs';
// CSS imports in correct order to prevent conflicts
import 'antd/dist/reset.css'; // Import Ant Design styles first
import { startTransition, StrictMode } from 'react';
import httpClient from './services/http-client.mjs';
import { resetModalState } from './store/slices/newModalSlice';
import './styles/App.css'; // Last: App-specific styles
import './styles/buttons.css'; // Sixth: Button styles
import './styles/common.css'; // Fifth: Common component styles
import './styles/global.css'; // Fourth: Global styles
import './styles/index.css'; // Seventh: Additional global styles
import './styles/reset.css'; // First: Reset browser defaults
import './styles/theme.css'; // Third: Define theme variables
import './styles/variables.css'; // Second: Define CSS variables
import { AUTH_CONFIG, ensurePortalRoot } from './utils';
import { ROUTER_FUTURE_FLAGS } from './utils/ensure-router-provider.mjs';
import {
  applyModalFixes,
  fixModalFormElements,
  forceModalInteractivity,
} from './utils/portalUtils';

// Import test auth flow for debugging (development only)
if (import.meta.env.DEV) {
  import('./test-auth-flow.js');
  import('./utils/clearUniverseCache.js');
}

// Ensure modal system is properly initialized
const initModalSystem = () => {
  console.log('Initializing modal system with Redux-based management');

  // Ensure portal root exists
  ensurePortalRoot();

  // Apply fixes for modal interactions
  applyModalFixes();
  forceModalInteractivity();
  fixModalFormElements();

  // Reset Redux modal state
  store.dispatch(resetModalState());

  // Make the store available globally for debugging
  if (import.meta.env.DEV) {
    window.__REDUX_STORE = store;

    // Add keyboard shortcut for debugging modals
    console.log('Modal debug shortcut registered: Press Alt+Shift+M to force show all modals');

    // Ensure forceShowAllModals is available if it exists
    if (typeof window.__modalUtils?.forceShowAllModals === 'function') {
      window.forceShowAllModals = window.__modalUtils.forceShowAllModals;
      console.log('Added forceShowAllModals to window for debugging');
    }
  }
};

// Setup global error handling
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error('Global error:', error || msg);
  return false;
};

// Detect environment
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

console.error('Before environment check - this should always show');

// Basic environment configuration
if (isDevelopment) {
  console.info('Running in development mode');
  console.error('Development mode - console.log should work normally');
} else if (isProduction) {
  console.error('Production mode detected - overriding console.log');
  // In production, silence console logs but keep errors
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;

  // Silence non-critical logs in production
  console.log = (...args) => {
    if (localStorage.getItem('debug') === 'true') {
      originalConsoleLog(...args);
    }
  };

  console.info = (...args) => {
    if (localStorage.getItem('debug') === 'true') {
      originalConsoleInfo(...args);
    }
  };
}

console.error('After environment check - this should show in dev mode');

// Add polyfill for structuredClone if needed
if (typeof window.structuredClone !== 'function') {
  window.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Add polyfill for CustomEvent if needed
if (typeof window.CustomEvent !== 'function') {
  window.CustomEvent = function (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };
}

// Setup storage event listener for auth sync across tabs
window.addEventListener('storage', (event) => {
  if (event.key === AUTH_CONFIG.TOKEN_KEY || event.key === AUTH_CONFIG.USER_KEY) {
    console.log('Auth storage changed in another tab, syncing state');

    // Dispatch a custom event that our app can listen for
    window.dispatchEvent(
      new window.CustomEvent('auth-storage-changed', {
        detail: { key: event.key, newValue: event.newValue },
      })
    );
  }
});

// Get or create the root element
const getRootElement = () => {
  let rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found, creating one');
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }
  return rootElement;
};

// Add debugging info
console.log('MODAL SYSTEM: Using Redux-based modal management exclusively');

// Configure React Router with future flags at the router level
const router = createBrowserRouter(
  [
    {
      path: '*',
      element: <App />,
    },
  ],
  {
    // Apply future flags at the router level to prevent warnings
    future: ROUTER_FUTURE_FLAGS,
  }
);

// Logs React Router configuration in development mode
if (isDevelopment) {
  console.log('React Router configuration:', router.routes[0].future);
}

// Set Authorization header from localStorage token on app startup
const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
if (token && httpClient?.defaults?.headers?.common) {
  httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Render application with improved error handling
const renderApp = () => {
  // Initialize modal system before rendering
  initModalSystem();

  const root = createRoot(getRootElement());

  try {
    // Use startTransition for Router rendering to ensure v7_startTransition works
    startTransition(() => {
      root.render(
        <StrictMode>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <RouterProvider router={router} future={ROUTER_FUTURE_FLAGS} />
            </PersistGate>
          </Provider>
        </StrictMode>
      );
    });
  } catch (error) {
    console.error('Error rendering app:', error);
    // Render a fallback if React fails to mount
    const rootElement = getRootElement();
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Failed to render application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <code style="display: block; margin-top: 20px; background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: left; overflow: auto;">
          ${error.toString()}
        </code>
      </div>
    `;
  }
};

// Initialize the application
const init = async () => {
  try {
    renderApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);

    // Try to render a fallback
    const rootElement = getRootElement();
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Failed to load application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <code style="display: block; margin-top: 20px; background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: left; overflow: auto;">
          ${error.toString()}
        </code>
      </div>
    `;
  }
};

// Start the application
init();
