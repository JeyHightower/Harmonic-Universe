import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import store, { persistor } from './store/store.mjs';
// CSS imports in correct order to prevent conflicts
import 'antd/dist/reset.css'; // Import Ant Design styles first
import { StrictMode } from 'react';
import './styles/App.css'; // Last: App-specific styles
import './styles/buttons.css'; // Sixth: Button styles
import './styles/common.css'; // Fifth: Common component styles
import './styles/global.css'; // Fourth: Global styles
import './styles/index.css'; // Seventh: Additional global styles
import './styles/reset.css'; // First: Reset browser defaults
import './styles/theme.css'; // Third: Define theme variables
import './styles/variables.css'; // Second: Define CSS variables
import { AUTH_CONFIG, ensurePortalRoot } from './utils';
import { setupModalDebugging } from './utils/modalDebug.mjs';
import {
  applyInteractionFixes,
  applyModalFixes,
  fixModalFormElements,
  forceModalInteractivity,
} from './utils/portalUtils';

// Execute immediate emergency fix for modal interactions
(function immediateModalFix() {
  // We need this to run as early as possible
  const fixModals = () => {
    console.log('[EMERGENCY FIX] Applying direct DOM fixes to modals');

    // Fix for all Ant Design modal components
    const fixAntModal = () => {
      // For all the ant-modal elements
      document
        .querySelectorAll(
          '.ant-modal-root, .ant-modal-wrap, .ant-modal-mask, .ant-modal, .ant-modal-content'
        )
        .forEach((el) => {
          if (el) {
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('z-index', '1000', 'important');
          }
        });

      // For all inputs inside modals
      document
        .querySelectorAll(
          '.ant-modal-content input, .ant-modal-body input, .ant-modal-content textarea, .ant-modal-body textarea, .ant-modal-content select, .ant-modal-body select, .ant-modal-content button, .ant-modal-body button'
        )
        .forEach((el) => {
          if (el) {
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('z-index', '9999999', 'important');
            el.style.setProperty('position', 'relative', 'important');

            // Add direct event handlers for inputs
            if (!el._inputClickHandler) {
              const handler = (e) => {
                e.stopPropagation();
                console.log(`[EMERGENCY] ${el.tagName} clicked`);
              };
              el._inputClickHandler = handler;
              el.addEventListener('click', handler, true);
              el.addEventListener('mousedown', handler, true);
              el.addEventListener('touchstart', handler, true);
            }
          }
        });

      // Fix the document click handler to not interfere with modals
      if (!document._modalFixHandler) {
        const handler = (e) => {
          const isInModal = e.target.closest('.ant-modal-content, .ant-modal-body');
          const isFormElement =
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.tagName === 'SELECT' ||
            e.target.tagName === 'BUTTON';

          if (isInModal && isFormElement) {
            console.log('[EMERGENCY] Document captured form input click');
            e.stopPropagation();
          }
        };
        document._modalFixHandler = handler;
        document.addEventListener('click', handler, true);
      }
    };

    // Apply fixes immediately and on an interval
    fixAntModal();

    // Set an interval to keep applying fixes in case elements are dynamically added
    if (!window._modalFixInterval) {
      window._modalFixInterval = setInterval(fixAntModal, 500);
      // Clear interval after 10 seconds to prevent performance issues
      setTimeout(() => {
        if (window._modalFixInterval) {
          clearInterval(window._modalFixInterval);
          window._modalFixInterval = null;
        }
      }, 10000);
    }

    // Create a MutationObserver to watch for dynamically added modals
    if (!window._modalObserver) {
      window._modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes && mutation.addedNodes.length) {
            // Check if any modals were added
            let hasModal = false;

            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (
                  node.classList?.contains('ant-modal') ||
                  node.querySelector?.('.ant-modal, .ant-modal-content')
                ) {
                  hasModal = true;
                  break;
                }
              }
            }

            if (hasModal) {
              console.log('[EMERGENCY] Modal elements detected in DOM, applying fixes');
              setTimeout(fixAntModal, 10);
            }
          }
        });
      });

      // Start observing
      window._modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  };

  // Apply the fix immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixModals);
  } else {
    fixModals();
  }

  // Also apply on load and after a short delay
  window.addEventListener('load', () => {
    fixModals();
    setTimeout(fixModals, 500);
  });

  // Make the fix accessible from the console for debugging
  window.__emergencyModalFix = fixModals;
})();

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

  // Initialize modal debugging tools in development
  setupModalDebugging();
  console.info('Modal debugging tools available at window.__modalDebug');
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

// Render application
const renderApp = () => {
  // Ensure portal root exists before rendering
  try {
    ensurePortalRoot();
  } catch (error) {
    console.error('Error initializing portal root:', error);
  }

  try {
    // React 18 API
    const root = createRoot(getRootElement());
    root.render(
      <StrictMode>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <App />
            </Router>
          </PersistGate>
        </Provider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering with React 18 API:', error);

    // Fallback to simple rendering
    try {
      const rootDiv = getRootElement();
      rootDiv.innerHTML = '';

      // Display fallback message
      const message = document.createElement('div');
      message.innerHTML = '<h1>Harmonic Universe</h1><p>Application is loading...</p>';
      rootDiv.appendChild(message);
    } catch (fallbackError) {
      console.error('Complete render failure:', fallbackError);
      getRootElement().innerHTML =
        '<div><h1>Harmonic Universe</h1><p>Application failed to initialize. Please try again later.</p></div>';
    }
  }
};

// Initialize the application
const init = async () => {
  try {
    // Initialize portal root
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      const newPortalRoot = document.createElement('div');
      newPortalRoot.id = 'portal-root';
      document.body.appendChild(newPortalRoot);
    }

    // Render the application
    renderApp();
  } catch (error) {
    console.error('Error initializing application:', error);
  }
};

// Initialize the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Apply global fixes for modals
// This ensures that even dynamically created modals get the fixes
document.addEventListener('DOMContentLoaded', () => {
  console.log('Applying global interaction fixes for modals');

  // Apply comprehensive modal fixes
  applyModalFixes();

  // Set up a scheduled reapplication of fixes to catch any dynamically added modals
  const applyFixesInterval = setInterval(() => {
    // Check if there are any modals in the DOM
    const hasModals = document.querySelector(
      '.modal-overlay, .modal-content, .ant-modal, .ant-modal-root, [role="dialog"]'
    );

    if (hasModals) {
      console.log('Found modals in DOM, reapplying fixes');
      applyModalFixes();
    }
  }, 2000); // Check every 2 seconds

  // Save the interval ID for potential cleanup
  window.__modalFixesInterval = applyFixesInterval;

  // Use MutationObserver to detect when modals are added to the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check if any modals were added
        const modalAdded = Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return (
              node.classList?.contains('modal-overlay') ||
              node.classList?.contains('modal-content') ||
              node.classList?.contains('ant-modal') ||
              node.classList?.contains('ant-modal-root') ||
              (node.hasAttribute?.('role') && node.getAttribute('role') === 'dialog') ||
              node.querySelector?.(
                '.modal-content, .modal-overlay, .ant-modal, .ant-modal-root, [role="dialog"]'
              )
            );
          }
          return false;
        });

        if (modalAdded) {
          console.log('Modal detected via MutationObserver, applying comprehensive fixes');
          // Apply fixes with slight delay to ensure DOM is fully updated
          setTimeout(() => {
            applyModalFixes();
          }, 100);

          // Apply again after a longer delay for any post-render updates
          setTimeout(() => {
            applyModalFixes();
          }, 500);
        }
      }
    });
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });

  // Add click event listener to handle modal interaction issues on the fly
  document.addEventListener(
    'click',
    (e) => {
      // Check if the click is inside a modal
      const modal = e.target.closest(
        '.modal-content, .modal-overlay, [role="dialog"], .ant-modal, .ant-modal-content'
      );
      if (modal) {
        console.log(`Click detected in modal on element:`, e.target.tagName, e.target);

        // Check if click is on form element
        const isFormElement =
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.tagName === 'SELECT' ||
          e.target.tagName === 'BUTTON';

        if (isFormElement) {
          console.log(`Form element clicked:`, e.target.tagName, e.target);

          // Force element to be interactive
          e.target.style.pointerEvents = 'auto';
          e.target.style.zIndex = '100000';
          e.stopPropagation();

          // If it's an input, focus it
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            setTimeout(() => e.target.focus(), 0);
          }
        }
      }
    },
    true // Use capture phase to handle events before they bubble
  );

  // Add a global emergency fix function
  window.__fixModalsNow = () => {
    console.log('Emergency modal fix triggered');
    applyModalFixes();
    setTimeout(() => forceModalInteractivity(), 100);
  };

  // Apply a final batch of fixes after the app has fully loaded
  setTimeout(() => {
    console.log('Applying post-load modal fixes');
    applyModalFixes();
  }, 2000);
});

// Add polyfill for stopImmediatePropagation if needed
if (!Event.prototype.stopImmediatePropagation) {
  console.log('Adding stopImmediatePropagation polyfill');
  Event.prototype.stopImmediatePropagation = function () {
    this.cancelBubble = true;
    this.stopPropagation();
    this._immediatePropagationStopped = true;
  };

  // Add a property to check if immediate propagation was stopped
  Object.defineProperty(Event.prototype, 'immediatePropagationStopped', {
    get: function () {
      return !!this._immediatePropagationStopped;
    },
  });
}

// Apply modal fixes immediately when the window loads
window.addEventListener('load', () => {
  console.log('Window loaded - applying modal fixes');
  setTimeout(() => {
    try {
      applyModalFixes();

      // Apply extreme emergency fix for form inputs
      forceModalInteractivity();

      // Set up a MutationObserver to watch for dynamically added modals
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            // Check if any of the added nodes are or contain modals
            let hasModals = false;
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (
                  node.classList?.contains('ant-modal') ||
                  node.classList?.contains('modal-content') ||
                  node.querySelector?.('.ant-modal, .modal-content, .ant-modal-content')
                ) {
                  hasModals = true;
                }
              }
            });

            if (hasModals) {
              console.log('Modals detected in DOM changes, applying fixes');
              setTimeout(() => {
                forceModalInteractivity();
              }, 50);
            }
          }
        });
      });

      // Start observing the entire document
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Add window.__fixModals to make it available in the console
      window.__fixModals = () => {
        console.log('Manual modal fix triggered');
        forceModalInteractivity();
      };
    } catch (error) {
      console.error('Error applying modal fixes on load:', error);
    }
  }, 100);
});

// Super aggressive direct document event interceptor for modal inputs
document.addEventListener(
  'pointerdown',
  (e) => {
    // Check if this is happening inside a modal
    const isInModal = e.target.closest(
      '.modal-content, .ant-modal-content, .modal-body, .ant-modal-body, .MuiDialogContent-root, .ant-modal-wrap'
    );

    // Check if this is a form input element
    const isFormInput =
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'SELECT';

    if (isInModal && isFormInput) {
      console.log('Emergency handler: Form input pointerdown in modal', e.target);

      // Prevent all event bubbling and default actions
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();

      // Apply maximum-strength interactive styling directly
      e.target.style.setProperty('pointer-events', 'auto', 'important');
      e.target.style.setProperty('z-index', '999999', 'important');
      e.target.style.setProperty('position', 'relative', 'important');
      e.target.style.setProperty('touch-action', 'auto', 'important');
      e.target.style.setProperty('user-select', 'auto', 'important');
      e.target.style.setProperty('-webkit-user-select', 'auto', 'important');
      e.target.style.setProperty(
        'cursor',
        e.target.tagName === 'SELECT' ? 'pointer' : 'text',
        'important'
      );

      // Force focus on the input immediately
      e.target.focus();

      // Add attributes that might help
      e.target.setAttribute('tabindex', '0');
      e.target.setAttribute('data-interactive', 'true');

      console.log('Applied emergency interactive styling to:', e.target);

      // Force the input's parent containers to be interactive too
      let parent = e.target.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        parent.style.setProperty('pointer-events', 'auto', 'important');
        depth++;
        parent = parent.parentElement;
      }
    }
  },
  true
); // Use capture phase to intercept earliest

// Add a more aggressive handler for form inputs in modals
document.addEventListener(
  'pointerdown',
  (e) => {
    // Check if this is happening inside a modal
    const isInModal = e.target.closest(
      '.modal-content, .ant-modal-content, .MuiDialogContent-root'
    );

    // Check if this is a form input element
    const isFormInput =
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'SELECT';

    if (isInModal && isFormInput) {
      console.log(
        'Form input pointerdown in modal:',
        e.target.tagName,
        e.target.name || e.target.id
      );

      // Prevent event bubbling
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Force input to be interactive
      e.target.style.pointerEvents = 'auto';
      e.target.style.zIndex = '100000';
      e.target.style.position = 'relative';

      // Focus the input
      setTimeout(() => {
        e.target.focus();
        console.log('Input focused:', e.target.tagName, e.target.name || e.target.id);
      }, 0);
    }
  },
  true
);

// Export necessary functions for component usage
export { applyInteractionFixes, applyModalFixes, fixModalFormElements, forceModalInteractivity };
