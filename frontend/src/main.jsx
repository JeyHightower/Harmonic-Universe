import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import store, { persistor } from './store/store.mjs';
// CSS imports in correct order to prevent conflicts
import 'antd/dist/reset.css'; // Import Ant Design styles first
import { startTransition, StrictMode } from 'react';
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
import { setupAudioContextInitialization } from './utils/audioManager';
import {
  applyModalFixes,
  fixModalFormElements,
  forceModalInteractivity,
} from './utils/portalUtils';
// Import Tone for AudioContext handling
import * as Tone from 'tone';

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

// Basic environment configuration
if (isDevelopment) {
  console.info('Running in development mode');
} else if (isProduction) {
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

// Configure React Router future flags
const router = createBrowserRouter(
  [
    {
      path: '*',
      element: <App />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

// Render application
const renderApp = () => {
  // Initialize modal system before rendering
  initModalSystem();

  const root = createRoot(getRootElement());

  // Use startTransition for Router rendering
  startTransition(() => {
    root.render(
      <StrictMode>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <RouterProvider router={router} />
          </PersistGate>
        </Provider>
      </StrictMode>
    );
  });
};

// Initialize the application
const init = async () => {
  try {
    // Prevent auto-play behavior that could trigger AudioContext errors
    document.body.addEventListener(
      'touchstart',
      function onFirstTouch() {
        // Only needed for the first touch
        document.body.removeEventListener('touchstart', onFirstTouch);
      },
      { once: true }
    );

    // Setup audio context initialization on user interaction
    setupAudioContextInitialization();

    // Add event listeners to resume AudioContext on user interaction
    const userInteractionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

    const resumeAudioContext = (event) => {
      // Only respond to trusted (actual user) events
      if (!event.isTrusted) return;

      if (typeof Tone !== 'undefined' && Tone.context) {
        if (Tone.context.state !== 'running') {
          console.log('Attempting to resume AudioContext after user interaction');

          // Wait a moment before trying to resume
          setTimeout(() => {
            Tone.context
              .resume()
              .then(() => {
                console.log('AudioContext resumed successfully');
              })
              .catch((err) => {
                console.error('Failed to resume AudioContext:', err);
              });
          }, 300);
        }
      }
    };

    // Remove previous listeners if any
    userInteractionEvents.forEach((event) => {
      document.removeEventListener(event, resumeAudioContext);
    });

    // Add listeners
    userInteractionEvents.forEach((event) => {
      document.addEventListener(event, resumeAudioContext, { capture: true });
    });

    // Add a special handler for the first click anywhere
    const firstInteractionHandler = (event) => {
      if (!event.isTrusted) return;

      // Try to start Tone.js after a small delay
      if (typeof Tone !== 'undefined') {
        console.log('First user interaction detected, starting Tone.js');

        // Delay starting to ensure we're within a valid user gesture
        setTimeout(() => {
          try {
            // Check if we need to unlock the AudioContext first
            if (window.AudioContext || window.webkitAudioContext) {
              const tempContext = new (window.AudioContext || window.webkitAudioContext)();
              tempContext
                .resume()
                .then(() => {
                  tempContext.close();
                  startToneJS();
                })
                .catch(() => {
                  tempContext.close();
                  startToneJS();
                });
            } else {
              startToneJS();
            }
          } catch (error) {
            console.warn('Error preparing audio environment:', error);
            startToneJS(); // Try anyway
          }
        }, 200);
      }

      // Remove the one-time handler after first interaction
      userInteractionEvents.forEach((evt) => {
        document.removeEventListener(evt, firstInteractionHandler, { capture: true });
      });
    };

    // Helper function to start Tone.js
    const startToneJS = () => {
      Tone.start()
        .then(() => {
          console.log('Tone.js started successfully');
        })
        .catch((err) => {
          console.warn('Error starting Tone.js:', err);
          // Fall back to just resuming the context if starting fails
          if (Tone.context) {
            Tone.context
              .resume()
              .catch((resumeErr) =>
                console.error('Failed to resume AudioContext as fallback:', resumeErr)
              );
          }
        });
    };

    // Add first interaction handler
    userInteractionEvents.forEach((event) => {
      document.addEventListener(event, firstInteractionHandler, { once: true, capture: true });
    });

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
