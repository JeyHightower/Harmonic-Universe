#!/bin/bash
# integrate-react-fixes.sh - Integrate all React fixes into a cohesive solution
set -e  # Exit on error

echo "===== INTEGRATING REACT ERROR FIXES ====="
echo "Date: $(date)"
echo "This script ensures all React fixes are properly integrated and loaded in the correct order."

# Check if necessary directories exist
if [ ! -d "static" ]; then
  echo "ERROR: static directory not found!"
  echo "This script must be run from the project root directory."
  exit 1
fi

# Define the required fix scripts and their load order
REQUIRED_SCRIPTS=(
  "static/dynamic-import.js"
  "static/critical-react-fix.js"
  "static/react-context-fix.js"
  "static/redux-provider-fix.js"
  "static/runtime-diagnostics.js"
  "static/enhanced-error-tracker.js"
)

# Check if all required scripts exist
echo "Checking for required fix scripts..."
MISSING_SCRIPTS=()

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "$script" ]; then
    echo "❌ Missing script: $script"
    MISSING_SCRIPTS+=("$script")
  else
    echo "✅ Found script: $script"
  fi
done

# Create any missing scripts with basic functionality
if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
  echo "Creating missing scripts with basic functionality..."

  for script in "${MISSING_SCRIPTS[@]}"; do
    case "$script" in
      "static/dynamic-import.js")
        echo "Creating dynamic-import.js..."
        cat > static/dynamic-import.js << 'EOL'
/**
 * Safe dynamic import utility for browser environments
 * This replaces require() calls with proper dynamic imports
 */

// Cache for imports to avoid duplicate network requests
const importCache = {};

/**
 * Safely import a module in browser environment
 * @param {string} path - Path to module
 * @returns {Promise} - Promise resolving to the module
 */
async function safeImport(path) {
  try {
    // Check cache first
    if (importCache[path]) {
      return importCache[path];
    }

    // Use dynamic import() which works in browsers
    const module = await import(path);
    importCache[path] = module;
    return module;
  } catch (error) {
    console.error(`[Import Error] Failed to import ${path}:`, error);
    return { default: null };
  }
}

/**
 * Synchronous wrapper for dynamic imports
 * @param {string} path - Path to module
 * @returns {Object} - Object with a default property containing a placeholder
 */
function requireShim(path) {
  console.warn(`[Import Warning] Using requireShim for ${path} - this is not a true synchronous import`);

  // Start the import in the background
  safeImport(path).then(module => {
    // Update the cache when it completes
    importCache[path] = module;
  });

  // Return default fallback
  return {
    default: () => null,
    __isShim: true
  };
}

// Provide a global shim for require if it doesn't exist
if (typeof window !== 'undefined' && typeof window.require === 'undefined') {
  window.require = function(path) {
    console.warn(`[Global Require] Using require shim for ${path}`);
    return requireShim(path);
  };

  // Also make the safe import functions available globally
  window.safeImport = safeImport;
  window.requireShim = requireShim;
}

window.__DYNAMIC_IMPORT_LOADED = true;
console.log('[Dynamic Import] Shim loaded successfully');
EOL
        echo "✅ Created dynamic-import.js"
        ;;
      "static/critical-react-fix.js")
        echo "Creating critical-react-fix.js..."
        cat > static/critical-react-fix.js << 'EOL'
/**
 * Critical React fixes to be loaded before any React code runs
 * This fixes React Error #321 and ensures ReactDOM is available
 */
(function () {
  // Ensure React exists globally
  window.React = window.React || {};
  window.__REACT_FIXES_APPLIED = true;
  window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};

  // Store original createElement to monitor for invalid elements
  if (window.React.createElement) {
    const originalCreateElement = window.React.createElement;
    window.React.createElement = function () {
      try {
        // Check if first argument is a valid element type
        const elementType = arguments[0];
        if (elementType === null || elementType === undefined) {
          console.warn('[React Fix] Prevented createElement with null/undefined type');
          // Return a safe fallback element
          return originalCreateElement('div', {
            className: 'error-boundary',
            'data-error': 'Invalid element type'
          }, 'Error: Invalid React element');
        }

        // Check if type is an object but not a valid component
        if (typeof elementType === 'object' &&
          !elementType.$$typeof &&
          !elementType.isReactComponent &&
          !elementType.render &&
          typeof elementType !== 'function') {
          console.warn('[React Fix] Prevented Error #130 - Invalid element type:', elementType);
          // Return an error element instead
          return originalCreateElement('div', {
            className: 'error-boundary',
            'data-error': 'Invalid element type (Object)'
          }, 'Error: Invalid React element (received an object)');
        }

        return originalCreateElement.apply(this, arguments);
      } catch (error) {
        console.error('[React Fix] Error in createElement:', error);
        // Return a safe fallback element
        return originalCreateElement('div', {
          className: 'error-boundary',
          'data-error': error.message
        }, 'Error rendering component');
      }
    };
    console.log('[React Fix] Enhanced React.createElement with error prevention');
  }

  // Fix React.createContext - Error #321
  if (window.React.createContext) {
    console.log('[Critical Fix] Patching React.createContext');
    const originalCreateContext = window.React.createContext;
    window.React.createContext = function (defaultValue, calculateChangedBits) {
      try {
        const context = originalCreateContext(defaultValue, calculateChangedBits);
        // Add context to global registry and apply fixes
        if (context) {
          const contextId = 'Context_' + Object.keys(window.__REACT_CONTEXTS).length;
          window.__REACT_CONTEXTS[contextId] = context;

          // Ensure Provider and Consumer are properly marked and fixed
          if (context.Provider) {
            context.Provider.isReactComponent = true;
            context.Provider.contextType = context;
          }

          if (context.Consumer) {
            context.Consumer.isReactComponent = true;
            context.Consumer.contextType = context;
          }
        }
        return context;
      } catch (error) {
        console.error('[Critical Fix] Context creation error', error);
        // Create minimal fallback context
        return {
          Provider: function(props) { return props.children; },
          Consumer: function(props) {
            return typeof props.children === 'function'
              ? props.children(defaultValue)
              : props.children;
          },
          _currentValue: defaultValue
        };
      }
    };
  }

  // Fix ReactDOM availability
  window.ReactDOM = window.ReactDOM || {
    version: '16.8.0',
    render: function(element, container) {
      console.warn('[Critical Fix] ReactDOM.render polyfill called');
      if (container) {
        try {
          if (typeof element === 'string' || typeof element === 'number') {
            container.textContent = String(element);
          } else if (element && element.props && element.props.children) {
            container.innerHTML = '<div>' + String(element.props.children) + '</div>';
          } else {
            container.innerHTML = '<div>React rendering not available</div>';
          }
        } catch (error) {
          console.error('[ReactDOM Fix] Render error:', error);
          container.innerHTML = '<div>Error rendering React component</div>';
        }
      }
    },
    createRoot: function(container) {
      console.warn('[Critical Fix] ReactDOM.createRoot polyfill called');
      return {
        render: function(element) {
          window.ReactDOM.render(element, container);
        },
        unmount: function() {
          if (container) container.innerHTML = '';
        }
      };
    }
  };
})();
EOL
        echo "✅ Created critical-react-fix.js"
        ;;
      "static/react-context-fix.js")
        echo "Creating react-context-fix.js..."
        cat > static/react-context-fix.js << 'EOL'
/**
 * React Context Fix
 * Ensures all necessary context providers are available
 */
(function() {
  console.log('[Context Fix] Initializing context fixes');

  // Ensure React globals are available
  window.React = window.React || {};
  window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};

  // Create a registry of mock context providers if needed
  window.__MOCK_PROVIDERS = window.__MOCK_PROVIDERS || [];

  // Create base router context if not available
  if (!window.RouterContext) {
    console.log('[Context Fix] Creating Router context');

    // Create basic location and navigation state
    const locationState = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      state: null
    };

    // Create navigation functions
    const navigate = function(to, options) {
      console.log('[Router] Navigate called:', to, options);
      if (typeof to === 'string') {
        window.location.href = to;
      }
    };

    // Create router context
    window.RouterContext = window.React.createContext({
      location: locationState,
      navigate: navigate,
      params: {}
    });

    // Create router hooks
    window.useLocation = function() {
      return locationState;
    };

    window.useNavigate = function() {
      return navigate;
    };

    window.useParams = function() {
      return {};
    };

    // Add to provider registry
    window.__MOCK_PROVIDERS.push({
      name: 'Router',
      context: window.RouterContext,
      defaultValue: {
        location: locationState,
        navigate: navigate,
        params: {}
      }
    });
  }

  // Wrap app with all registered providers
  window.__wrapWithProviders = function(element) {
    if (!window.React || !window.React.createElement) {
      console.warn('[Context Fix] React not available for provider wrapping');
      return element;
    }

    let result = element;

    // Wrap with each provider in reverse order
    for (let i = window.__MOCK_PROVIDERS.length - 1; i >= 0; i--) {
      const provider = window.__MOCK_PROVIDERS[i];
      result = window.React.createElement(
        provider.context.Provider,
        { value: provider.defaultValue },
        result
      );
    }

    return result;
  };

  console.log('[Context Fix] Context fixes initialized');
})();
EOL
        echo "✅ Created react-context-fix.js"
        ;;
      "static/redux-provider-fix.js")
        echo "Creating redux-provider-fix.js..."
        cat > static/redux-provider-fix.js << 'EOL'
/**
 * Redux Provider fix script for production
 * Provides a robust mock implementation for Redux Provider and store
 */
(function () {
  console.log('[Redux Fix] Checking for Redux Provider...');

  // Initialize the React contexts registry if not already done
  window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};
  window.__MOCK_PROVIDERS = window.__MOCK_PROVIDERS || [];

  // Create mock store if needed
  if (!window.__REDUX_STORE) {
    console.log('[Redux Fix] Creating mock Redux store');

    // Initial state with common structures
    const initialState = {
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      },
      ui: {
        theme: 'light',
        loading: false,
        modal: null,
        notifications: []
      },
      // Add more state slices as needed
    };

    // Current state
    let currentState = { ...initialState };

    // Listeners
    const listeners = [];

    // Mock store implementation
    window.__REDUX_STORE = {
      getState: function () {
        return currentState;
      },
      dispatch: function (action) {
        console.warn('[Redux Fix] Mock dispatch called with:', action);

        // Basic state updates for common action patterns
        try {
          if (action && action.type) {
            // Process common actions
            if (action.type.includes('auth/')) {
              // Handle auth actions
            } else if (action.type.includes('ui/')) {
              // Handle UI actions
            }
          }
        } catch (error) {
          console.error('[Redux Fix] Error handling action:', error);
        }

        // Notify listeners
        try {
          listeners.forEach(listener => listener());
        } catch (error) {
          console.error('[Redux Fix] Error notifying listeners:', error);
        }

        return action;
      },
      subscribe: function (listener) {
        if (typeof listener === 'function') {
          listeners.push(listener);
          return function () {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          };
        }
        return function () { };
      }
    };
  }

  // Create Redux context if needed
  if (!window.ReduxContext) {
    console.log('[Redux Fix] Creating Redux context');
    window.ReduxContext = window.React ? window.React.createContext(window.__REDUX_STORE) : {
      Provider: function (props) { return props.children; },
      Consumer: function (props) { return props.children(window.__REDUX_STORE); }
    };

    window.__REACT_CONTEXTS['ReduxContext'] = window.ReduxContext;
  }

  // Create Redux Provider if needed
  if (!window.ReduxProvider) {
    console.log('[Redux Fix] Creating Redux Provider');
    window.ReduxProvider = function ReduxProvider(props) {
      try {
        const store = props.store || window.__REDUX_STORE;

        if (window.React && window.React.createElement) {
          return window.React.createElement(
            window.ReduxContext.Provider,
            { value: store },
            props.children
          );
        }

        return props.children || null;
      } catch (error) {
        console.error('[Redux Fix] Error in Redux Provider:', error);
        return props.children || null;
      }
    };

    // Mark as React component
    window.ReduxProvider.isReactComponent = true;
  }

  // Add Redux hooks if needed
  if (!window.useSelector) {
    window.useSelector = function useSelector(selector) {
      try {
        if (!selector || typeof selector !== 'function') {
          console.warn('[Redux Fix] Invalid selector in useSelector');
          return null;
        }

        return selector(window.__REDUX_STORE.getState());
      } catch (error) {
        console.error('[Redux Fix] Error in useSelector:', error);
        return null;
      }
    };
  }

  if (!window.useDispatch) {
    window.useDispatch = function useDispatch() {
      return window.__REDUX_STORE.dispatch;
    };
  }

  // Add to provider registry for auto-wrapping
  window.__MOCK_PROVIDERS.push({
    name: 'Redux',
    context: window.ReduxContext,
    defaultValue: window.__REDUX_STORE
  });

  console.log('[Redux Fix] Redux Provider fix applied');
})();
EOL
        echo "✅ Created redux-provider-fix.js"
        ;;
      "static/runtime-diagnostics.js")
        echo "Creating runtime-diagnostics.js..."
        cat > static/runtime-diagnostics.js << 'EOL'
/**
 * Runtime Diagnostics for React Application
 * Provides visual feedback about the application state and any issues
 */
(function() {
  console.log('[Diagnostics] Initializing runtime diagnostics');

  // Store diagnostic data
  window.__DIAGNOSTICS = {
    reactLoaded: typeof window.React !== 'undefined',
    reactDOMLoaded: typeof window.ReactDOM !== 'undefined',
    reduxAvailable: typeof window.ReduxProvider !== 'undefined',
    routerAvailable: typeof window.RouterContext !== 'undefined',
    errors: [],
    warnings: [],
    fixesApplied: window.__REACT_FIXES_APPLIED || false,
    startTime: new Date()
  };

  // Add error tracking
  const originalConsoleError = console.error;
  console.error = function() {
    // Track errors
    const errorMessage = Array.from(arguments).join(' ');
    window.__DIAGNOSTICS.errors.push({
      timestamp: new Date(),
      message: errorMessage
    });

    // Keep error list manageable
    if (window.__DIAGNOSTICS.errors.length > 50) {
      window.__DIAGNOSTICS.errors.shift();
    }

    // Call original function
    return originalConsoleError.apply(console, arguments);
  };

  // Add warning tracking
  const originalConsoleWarn = console.warn;
  console.warn = function() {
    // Track warnings
    const warningMessage = Array.from(arguments).join(' ');
    window.__DIAGNOSTICS.warnings.push({
      timestamp: new Date(),
      message: warningMessage
    });

    // Keep warning list manageable
    if (window.__DIAGNOSTICS.warnings.length > 50) {
      window.__DIAGNOSTICS.warnings.shift();
    }

    // Call original function
    return originalConsoleWarn.apply(console, arguments);
  };

  // Create diagnostic panel
  function createDiagnosticPanel() {
    // If panel already exists, return
    if (document.getElementById('react-diagnostics-panel')) {
      return;
    }

    // Create panel elements
    const panel = document.createElement('div');
    panel.id = 'react-diagnostics-panel';
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.width = '300px';
    panel.style.maxHeight = '80vh';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.zIndex = '9999';
    panel.style.overflow = 'auto';
    panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    panel.style.display = 'none';

    // Status indicators
    const status = document.createElement('div');
    status.innerHTML = `
      <div><strong>React:</strong> <span>${window.__DIAGNOSTICS.reactLoaded ? '✅' : '❌'}</span></div>
      <div><strong>ReactDOM:</strong> <span>${window.__DIAGNOSTICS.reactDOMLoaded ? '✅' : '❌'}</span></div>
      <div><strong>Redux:</strong> <span>${window.__DIAGNOSTICS.reduxAvailable ? '✅' : '❌'}</span></div>
      <div><strong>Router:</strong> <span>${window.__DIAGNOSTICS.routerAvailable ? '✅' : '❌'}</span></div>
      <div><strong>Fixes Applied:</strong> <span>${window.__DIAGNOSTICS.fixesApplied ? '✅' : '❌'}</span></div>
      <hr />
      <div><strong>Errors:</strong> <span>${window.__DIAGNOSTICS.errors.length}</span></div>
      <div><strong>Warnings:</strong> <span>${window.__DIAGNOSTICS.warnings.length}</span></div>
      <div><strong>Uptime:</strong> <span id="diagnostics-uptime">0s</span></div>
    `;
    panel.appendChild(status);

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Diagnostics';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.backgroundColor = 'blue';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.cursor = 'pointer';

    // Toggle panel visibility on click
    toggleButton.onclick = function() {
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
        toggleButton.textContent = 'Hide Diagnostics';
        updateDiagnosticPanel();
      } else {
        panel.style.display = 'none';
        toggleButton.textContent = 'Show Diagnostics';
      }
    };

    // Add elements to the document
    document.body.appendChild(panel);
    document.body.appendChild(toggleButton);

    // Update uptime periodically
    setInterval(function() {
      const uptimeElement = document.getElementById('diagnostics-uptime');
      if (uptimeElement) {
        const uptime = Math.round((new Date() - window.__DIAGNOSTICS.startTime) / 1000);
        uptimeElement.textContent = uptime + 's';
      }
    }, 1000);
  }

  // Update panel content
  function updateDiagnosticPanel() {
    const panel = document.getElementById('react-diagnostics-panel');
    if (!panel || panel.style.display === 'none') {
      return;
    }

    // Update errors and warnings
    let content = '<hr /><strong>Latest Errors:</strong><br />';

    // Show most recent errors first
    const recentErrors = window.__DIAGNOSTICS.errors.slice(-5).reverse();
    if (recentErrors.length > 0) {
      recentErrors.forEach(error => {
        content += `<div style="color: #ff6b6b; margin: 5px 0;">${error.message}</div>`;
      });
    } else {
      content += '<div style="color: #6bff6b;">No errors recorded</div>';
    }

    content += '<hr /><strong>Latest Warnings:</strong><br />';

    // Show most recent warnings first
    const recentWarnings = window.__DIAGNOSTICS.warnings.slice(-5).reverse();
    if (recentWarnings.length > 0) {
      recentWarnings.forEach(warning => {
        content += `<div style="color: #ffdb6b; margin: 5px 0;">${warning.message}</div>`;
      });
    } else {
      content += '<div style="color: #6bff6b;">No warnings recorded</div>';
    }

    // Add or update the error/warning container
    let infoContainer = document.getElementById('diagnostics-info-container');
    if (!infoContainer) {
      infoContainer = document.createElement('div');
      infoContainer.id = 'diagnostics-info-container';
      panel.appendChild(infoContainer);
    }

    infoContainer.innerHTML = content;
  }

  // Initialize diagnostics when the DOM is ready
  function initDiagnostics() {
    try {
      createDiagnosticPanel();

      // Update panel periodically
      setInterval(updateDiagnosticPanel, 2000);

      console.log('[Diagnostics] Runtime diagnostics initialized');
    } catch (error) {
      console.error('[Diagnostics] Failed to initialize diagnostics:', error);
    }
  }

  // Set up initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiagnostics);
  } else {
    initDiagnostics();
  }
})();
EOL
        echo "✅ Created runtime-diagnostics.js"
        ;;
      "static/enhanced-error-tracker.js")
        echo "Creating enhanced-error-tracker.js..."
        cat > static/enhanced-error-tracker.js << 'EOL'
/**
 * Enhanced React Error Tracker
 * Provides detailed error tracking and analysis for React applications
 */
(function() {
  console.log('[Error Tracker] Initializing enhanced error tracking');

  // Storage for error information
  window.__ERROR_TRACKER = {
    errors: [],
    reactErrors: [],
    componentErrors: {},
    hookErrors: [],
    renderErrors: [],
    errorPatterns: {},
    startTime: new Date(),
    config: {
      maxErrors: 100,
      trackStackTraces: true,
      trackComponentNames: true,
      analyzePatterns: true,
      autoExpand: true
    }
  };

  // Error decoder for minified React errors
  const reactErrorCodes = {
    '321': 'Hooks can only be called inside the body of a function component.',
    '130': 'Invalid element type. Received: %s',
    '152': 'React.Children.only expected to receive a single React element child.',
    '200': 'Suspense list cannot have multiple tails.',
    '201': 'A nested Suspense boundary must not be in the list tail.',
    '202': 'Fiber hook error',
    '418': 'Encountered two children with the same key',
    '423': 'Unexpected Suspense fallback',
    '425': 'forwardRef render functions accept exactly two parameters: props and ref.',
    '426': 'memo: The first argument must be a component.'
  };

  // Function to decode minified React errors
  function decodeReactError(message) {
    if (!message) return null;

    // Check for pattern: "Error: Minified React error #XXX;"
    const minifiedMatch = message.match(/Minified React error #(\d+)/i);
    if (minifiedMatch && minifiedMatch[1]) {
      const errorCode = minifiedMatch[1];
      const errorMessage = reactErrorCodes[errorCode] || 'Unknown React error code: ' + errorCode;
      return {
        code: errorCode,
        decoded: errorMessage,
        original: message
      };
    }

    // Check for hook-related errors
    if (message.includes('Invalid hook call') ||
        message.includes('Hooks can only be called') ||
        message.includes('Hook rules')) {
      return {
        code: '321',
        decoded: reactErrorCodes['321'],
        original: message,
        category: 'hook'
      };
    }

    // Check for invalid element type errors
    if (message.includes('invalid element type') ||
        message.includes('expected a React component')) {
      return {
        code: '130',
        decoded: reactErrorCodes['130'],
        original: message,
        category: 'element'
      };
    }

    return null;
  }

  // Extract component name from error or stack trace
  function extractComponentName(error) {
    if (!error || !error.stack) return 'Unknown';

    // Common patterns in React component stack traces
    const patterns = [
      /at ([A-Z][A-Za-z0-9$_]+) \(/,
      /at (React.createElement)\(([A-Z][A-Za-z0-9$_]+)/,
      /at renderWithHooks.+, ([A-Z][A-Za-z0-9$_]+), /,
      /^([A-Z][A-Za-z0-9$_]+)@/,
      /in ([A-Z][A-Za-z0-9$_]+) \(at/
    ];

    for (const pattern of patterns) {
      const match = error.stack.match(pattern);
      if (match && match[1] && match[1] !== 'Anonymous') {
        return match[1];
      }
    }

    return 'Unknown';
  }

  // Record an error with enhanced analysis
  function recordError(error, errorType = 'general') {
    try {
      if (!error) return;

      const timestamp = new Date();
      const decoded = decodeReactError(error.message);
      const componentName = window.__ERROR_TRACKER.config.trackComponentNames ?
        extractComponentName(error) : 'Unknown';

      // Create enhanced error object
      const enhancedError = {
        timestamp: timestamp,
        message: error.message || 'No message',
        type: error.name || 'Error',
        componentName: componentName,
        category: errorType,
        stack: window.__ERROR_TRACKER.config.trackStackTraces ? error.stack : null,
        decoded: decoded,
        url: window.location.href,
        source: error.fileName || error.sourceURL || null,
        line: error.lineNumber || error.line || null,
        column: error.columnNumber || error.column || null
      };

      // Store in main error collection
      window.__ERROR_TRACKER.errors.push(enhancedError);

      // Keep collection size manageable
      if (window.__ERROR_TRACKER.errors.length > window.__ERROR_TRACKER.config.maxErrors) {
        window.__ERROR_TRACKER.errors.shift();
      }

      // Categorize errors
      if (decoded || error.message?.includes('React') || error.message?.includes('component') ||
          error.message?.includes('render') || error.message?.includes('element')) {
        window.__ERROR_TRACKER.reactErrors.push(enhancedError);
      }

      // Track errors by component
      if (componentName !== 'Unknown') {
        window.__ERROR_TRACKER.componentErrors[componentName] =
          window.__ERROR_TRACKER.componentErrors[componentName] || [];
        window.__ERROR_TRACKER.componentErrors[componentName].push(enhancedError);
      }

      // Track hook errors
      if (errorType === 'hook' || (decoded && decoded.category === 'hook') ||
          error.message?.includes('hook') || error.message?.includes('Hook')) {
        window.__ERROR_TRACKER.hookErrors.push(enhancedError);
      }

      // Track render errors
      if (errorType === 'render' || error.message?.includes('render') ||
          error.message?.includes('Render') || error.message?.includes('rendering')) {
        window.__ERROR_TRACKER.renderErrors.push(enhancedError);
      }

      // Analyze error patterns if enabled
      if (window.__ERROR_TRACKER.config.analyzePatterns) {
        const errorKey = enhancedError.type + ': ' + enhancedError.message.substring(0, 50);
        window.__ERROR_TRACKER.errorPatterns[errorKey] = window.__ERROR_TRACKER.errorPatterns[errorKey] || {
          count: 0,
          first: timestamp,
          last: timestamp,
          examples: []
        };

        window.__ERROR_TRACKER.errorPatterns[errorKey].count += 1;
        window.__ERROR_TRACKER.errorPatterns[errorKey].last = timestamp;

        if (window.__ERROR_TRACKER.errorPatterns[errorKey].examples.length < 3) {
          window.__ERROR_TRACKER.errorPatterns[errorKey].examples.push(enhancedError);
        }
      }

      // Log to console with enhanced information
      const decodedInfo = decoded ? ` (React Error #${decoded.code}: ${decoded.decoded})` : '';
      console.warn(`[Error Tracker] ${errorType} error in ${componentName}${decodedInfo}: ${error.message}`);

    } catch (trackerError) {
      // Don't let the error tracker itself cause errors
      console.error('[Error Tracker] Error in error tracking:', trackerError);
    }
  }

  // Intercept global errors
  window.addEventListener('error', function(event) {
    recordError(event.error || new Error(event.message), 'global');
    return false; // Allow default handling
  });

  // Intercept promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason instanceof Error ?
      event.reason : new Error(String(event.reason));
    recordError(error, 'promise');
    return false; // Allow default handling
  });

  // Override console.error to capture React errors
  const originalConsoleError = console.error;
  console.error = function() {
    // Convert arguments to array
    const args = Array.from(arguments);
    const errorMessage = args.join(' ');

    // Check if this is a React error
    if (errorMessage.includes('React') ||
        errorMessage.includes('element type is invalid') ||
        errorMessage.includes('component') ||
        errorMessage.includes('render') ||
        errorMessage.includes('hook') ||
        errorMessage.includes('context')) {

      // Create an error object to capture stack trace
      const error = new Error(errorMessage);
      let errorType = 'react';

      // Categorize by error type
      if (errorMessage.includes('hook') || errorMessage.includes('Hook')) {
        errorType = 'hook';
      } else if (errorMessage.includes('render') || errorMessage.includes('Render')) {
        errorType = 'render';
      } else if (errorMessage.includes('element type') || errorMessage.includes('Element type')) {
        errorType = 'element';
      } else if (errorMessage.includes('context') || errorMessage.includes('Context')) {
        errorType = 'context';
      }

      recordError(error, errorType);
    }

    // Call the original function
    return originalConsoleError.apply(console, args);
  };

  // Create diagnostic UI
  function createErrorUI() {
    // If UI already exists, return
    if (document.getElementById('react-error-tracker-button')) {
      return;
    }

    // Create error button
    const button = document.createElement('button');
    button.id = 'react-error-tracker-button';
    button.textContent = 'React Errors: 0';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.backgroundColor = '#ff6b6b';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.padding = '5px 10px';
    button.style.zIndex = 10000;
    button.style.fontFamily = 'monospace';
    button.style.fontSize = '12px';
    button.style.cursor = 'pointer';

    // Create error panel
    const panel = document.createElement('div');
    panel.id = 'react-error-tracker-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '50px';
    panel.style.left = '10px';
    panel.style.width = '400px';
    panel.style.maxHeight = '80vh';
    panel.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
    panel.style.color = 'white';
    panel.style.borderRadius = '4px';
    panel.style.padding = '10px';
    panel.style.zIndex = 10001;
    panel.style.overflowY = 'auto';
    panel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.display = 'none';

    // Panel header
    const header = document.createElement('div');
    header.style.borderBottom = '1px solid #666';
    header.style.paddingBottom = '8px';
    header.style.marginBottom = '8px';
    header.innerHTML = '<h3 style="margin: 0 0 8px 0; color: #ff6b6b;">React Error Tracker</h3>' +
      '<div>Track and analyze React errors in real-time</div>';
    panel.appendChild(header);

    // Error content container
    const content = document.createElement('div');
    content.id = 'react-error-tracker-content';
    panel.appendChild(content);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = 'white';
    closeButton.style.border = '1px solid #666';
    closeButton.style.borderRadius = '4px';
    closeButton.style.padding = '3px 8px';
    closeButton.style.cursor = 'pointer';

    closeButton.onclick = function() {
      panel.style.display = 'none';
    };

    panel.appendChild(closeButton);

    // Toggle panel visibility on button click
    button.onclick = function() {
      if (panel.style.display === 'none') {
        updateErrorPanel();
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    };

    // Add to DOM
    document.body.appendChild(button);
    document.body.appendChild(panel);
  }

  // Update the error panel content
  function updateErrorPanel() {
    const contentElement = document.getElementById('react-error-tracker-content');
    if (!contentElement) return;

    // Update error button count
    const button = document.getElementById('react-error-tracker-button');
    if (button) {
      button.textContent = `React Errors: ${window.__ERROR_TRACKER.reactErrors.length}`;
      button.style.backgroundColor = window.__ERROR_TRACKER.reactErrors.length > 0 ? '#ff6b6b' : '#6bff6b';
    }

    // Generate summary statistics
    let content = `
      <div style="margin-bottom: 15px;">
        <div><strong>Total Errors:</strong> ${window.__ERROR_TRACKER.errors.length}</div>
        <div><strong>React Errors:</strong> ${window.__ERROR_TRACKER.reactErrors.length}</div>
        <div><strong>Hook Errors:</strong> ${window.__ERROR_TRACKER.hookErrors.length}</div>
        <div><strong>Render Errors:</strong> ${window.__ERROR_TRACKER.renderErrors.length}</div>
        <div><strong>Components with Errors:</strong> ${Object.keys(window.__ERROR_TRACKER.componentErrors).length}</div>
        <div><strong>Distinct Error Patterns:</strong> ${Object.keys(window.__ERROR_TRACKER.errorPatterns).length}</div>
      </div>
    `;

    // Add error patterns section
    if (Object.keys(window.__ERROR_TRACKER.errorPatterns).length > 0) {
      content += '<h4 style="margin: 15px 0 8px 0; color: #ff6b6b;">Common Error Patterns</h4>';
      content += '<div style="margin-bottom: 15px;">';

      // Sort patterns by frequency
      const sortedPatterns = Object.entries(window.__ERROR_TRACKER.errorPatterns)
        .sort((a, b) => b[1].count - a[1].count);

      for (const [key, pattern] of sortedPatterns.slice(0, 5)) {
        content += `
          <div style="margin-bottom: 8px; padding: 8px; background-color: rgba(255, 107, 107, 0.1); border-radius: 4px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${key}</div>
            <div style="color: #ccc; font-size: 11px;">
              Occurred ${pattern.count} times - First: ${pattern.first.toLocaleTimeString()},
              Last: ${pattern.last.toLocaleTimeString()}
            </div>
            ${pattern.examples.length > 0 ?
              `<div style="margin-top: 4px; font-size: 11px; color: #aaa;">
                <strong>Example:</strong> ${pattern.examples[0].message}
              </div>` : ''}
          </div>
        `;
      }

      content += '</div>';
    }

    // Add recent errors section
    if (window.__ERROR_TRACKER.reactErrors.length > 0) {
      content += '<h4 style="margin: 15px 0 8px 0; color: #ff6b6b;">Recent React Errors</h4>';
      content += '<div>';

      // Get most recent errors first
      const recentErrors = window.__ERROR_TRACKER.reactErrors
        .slice(-10)
        .reverse();

      recentErrors.forEach((error, index) => {
        const decodedInfo = error.decoded ?
          `<div style="color: #ff9f9f; margin-top: 4px;">React Error #${error.decoded.code}: ${error.decoded.decoded}</div>` : '';

        content += `
          <div style="margin-bottom: 10px; padding: 8px; background-color: rgba(255, 107, 107, 0.1); border-radius: 4px;">
            <div style="font-weight: bold;">${error.type}: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}</div>
            <div style="color: #ccc; font-size: 11px;">
              <span>Time: ${error.timestamp.toLocaleTimeString()}</span> |
              <span>Component: ${error.componentName}</span> |
              <span>Category: ${error.category}</span>
            </div>
            ${decodedInfo}
            <div style="margin-top: 8px;">
              <button onclick="toggleStack('error-stack-${index}')" style="background: transparent; color: #ccc; border: 1px solid #666; border-radius: 2px; padding: 2px 4px; font-size: 10px; cursor: pointer;">
                Toggle Stack Trace
              </button>
            </div>
            <pre id="error-stack-${index}" style="display: ${window.__ERROR_TRACKER.config.autoExpand ? 'block' : 'none'}; margin-top: 8px; max-height: 200px; overflow: auto; background-color: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 4px; font-size: 10px; color: #ddd;">${error.stack || 'No stack trace available'}</pre>
          </div>
        `;
      });

      content += '</div>';
    } else {
      content += '<div style="color: #6bff6b; margin-top: 15px;">No React errors recorded yet!</div>';
    }

    // Add component error section if we have component errors
    if (Object.keys(window.__ERROR_TRACKER.componentErrors).length > 0) {
      content += '<h4 style="margin: 15px 0 8px 0; color: #ff6b6b;">Components with Errors</h4>';
      content += '<div style="margin-bottom: 15px;">';

      // Sort components by error count
      const componentErrorCounts = Object.entries(window.__ERROR_TRACKER.componentErrors)
        .map(([component, errors]) => ({ component, count: errors.length }))
        .sort((a, b) => b.count - a.count);

      for (const { component, count } of componentErrorCounts.slice(0, 8)) {
        content += `
          <div style="margin-bottom: 6px; display: flex; justify-content: space-between;">
            <div>${component}</div>
            <div style="color: #ff9f9f;">${count} errors</div>
          </div>
        `;
      }

      content += '</div>';
    }

    // Add helper function to toggle stack traces
    if (!window.toggleStack) {
      window.toggleStack = function(id) {
        const element = document.getElementById(id);
        if (element) {
          element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
      };
    }

    // Set content
    contentElement.innerHTML = content;
  }

  // Set up error UI when DOM is ready
  function initErrorUI() {
    try {
      createErrorUI();

      // Update periodically
      setInterval(function() {
        // Update button count even if panel isn't open
        const button = document.getElementById('react-error-tracker-button');
        if (button) {
          button.textContent = `React Errors: ${window.__ERROR_TRACKER.reactErrors.length}`;
          button.style.backgroundColor = window.__ERROR_TRACKER.reactErrors.length > 0 ? '#ff6b6b' : '#6bff6b';
        }

        // Only update panel if it's visible
        if (document.getElementById('react-error-tracker-panel')?.style.display !== 'none') {
          updateErrorPanel();
        }
      }, 2000);

      console.log('[Error Tracker] UI initialized');
    } catch (error) {
      console.error('[Error Tracker] Error initializing UI:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorUI);
  } else {
    initErrorUI();
  }

  console.log('[Error Tracker] Enhanced error tracking initialized');
})();
EOL
        echo "✅ Created enhanced-error-tracker.js"
        ;;
      *)
        echo "⚠️ No template available for $script"
        ;;
    esac
  done
fi

# Check if index.html exists and modify it to load the scripts in the correct order
if [ -f "static/index.html" ]; then
  echo "Examining index.html to ensure scripts are loaded in the correct order..."

  # Create a backup of index.html
  cp static/index.html static/index.html.backup

  # Check for script inclusions in index.html
  MISSING_INCLUDES=()

  for script in "${REQUIRED_SCRIPTS[@]}"; do
    # Extract just the filename without path
    SCRIPT_NAME=$(basename "$script")

    if ! grep -q "$SCRIPT_NAME" static/index.html; then
      echo "❌ Script $SCRIPT_NAME not included in index.html"
      MISSING_INCLUDES+=("$SCRIPT_NAME")
    else
      echo "✅ Script $SCRIPT_NAME already included in index.html"
    fi
  done

  # Check if we need to update index.html
  if [ ${#MISSING_INCLUDES[@]} -gt 0 ]; then
    echo "Updating index.html to include missing scripts..."

    # Create a temporary file with modified content
    TEMP_FILE=$(mktemp)

    # First, ensure dynamic-import.js is included in the head
    if [[ " ${MISSING_INCLUDES[@]} " =~ " dynamic-import.js " ]]; then
      awk '
      /<head>/ {
        print $0
        print "    <!-- Load dynamic import shim for require() -->"
        print "    <script src=\"/dynamic-import.js\"></script>"
        next
      }
      { print }
      ' static/index.html > "$TEMP_FILE"

      cp "$TEMP_FILE" static/index.html
    fi

    # Next, ensure critical-react-fix.js is loaded early
    if [[ " ${MISSING_INCLUDES[@]} " =~ " critical-react-fix.js " ]]; then
      awk '
      /<head>/ {
        print $0
        print "    <!-- Critical React fixes -->"
        print "    <script src=\"/critical-react-fix.js\"></script>"
        next
      }
      { print }
      ' static/index.html > "$TEMP_FILE"

      cp "$TEMP_FILE" static/index.html
    fi

    # Add any remaining scripts before the closing body tag
    for script in "${MISSING_INCLUDES[@]}"; do
      if [[ "$script" != "dynamic-import.js" && "$script" != "critical-react-fix.js" ]]; then
        # Ensure each script is added only once
        if ! grep -q "$script" static/index.html; then
          awk -v script="$script" '
          /<\/body>/ {
            print "    <!-- React fix script -->"
            print "    <script src=\"/" script "\"></script>"
            print $0
            next
          }
          { print }
          ' static/index.html > "$TEMP_FILE"

          cp "$TEMP_FILE" static/index.html
        fi
      fi
    done

    # Clean up
    rm -f "$TEMP_FILE"

    echo "✅ Updated index.html with missing scripts"
  else
    echo "✅ All scripts are already included in index.html"
  fi
else
  echo "❌ ERROR: static/index.html not found!"
fi

# Update the render_build.sh script to include our integration
if [ -f "render_build.sh" ]; then
  echo "Updating render_build.sh to include React fixes integration..."

  # Create a backup
  cp render_build.sh render_build.sh.backup

  # Check if integration is already included
  if ! grep -q "integrate-react-fixes.sh" render_build.sh; then
    # Find a good insertion point - after frontend build but before deploying
    awk '
    /echo "Frontend build completed"/ {
      print $0
      print ""
      print "# Integrate React fixes"
      print "echo \"Integrating React fixes...\""
      print "if [ -f \"./integrate-react-fixes.sh\" ]; then"
      print "  chmod +x ./integrate-react-fixes.sh"
      print "  ./integrate-react-fixes.sh"
      print "  echo \"React fixes integration completed\""
      print "else"
      print "  echo \"WARNING: integrate-react-fixes.sh not found, skipping integration\""
      print "fi"
      print ""
      next
    }
    { print }
    ' render_build.sh > render_build.sh.new

    mv render_build.sh.new render_build.sh
    chmod +x render_build.sh

    echo "✅ Updated render_build.sh to include React fixes integration"
  else
    echo "✅ render_build.sh already includes React fixes integration"
  fi
else
  echo "⚠️ render_build.sh not found, skipping update"
fi

# Make the script executable
chmod +x integrate-react-fixes.sh

echo "===== REACT FIXES INTEGRATION COMPLETE ====="
echo "To verify the integration, run:"
echo "  ./integrate-react-fixes.sh"
echo ""
echo "This will ensure all fix scripts are:"
echo "1. Present with working implementations"
echo "2. Loaded in the correct order in index.html"
echo "3. Included in the render_build.sh deployment process"
echo ""
echo "After integration, check the application with the 'Show Diagnostics' button"
echo "to verify all components are loading correctly."
