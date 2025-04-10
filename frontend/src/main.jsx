import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// CSS imports in correct order to prevent conflicts
import "./styles/reset.css"; // First: Reset browser defaults
import "./styles/variables.css"; // Second: Define CSS variables
import "./styles/theme.css"; // Third: Define theme variables
import "./styles/global.css"; // Fourth: Global styles
import "./styles/common.css"; // Fifth: Common component styles
import "./styles/buttons.css"; // Sixth: Button styles
import "./styles/index.css"; // Seventh: Additional global styles
import "./styles/App.css"; // Last: App-specific styles
import { ensurePortalRoot } from "./utils/portalUtils";
import { AUTH_CONFIG } from "./utils/config";

// Setup global error handling
const handleGlobalError = (error, info) => {
  console.error('Global error caught:', error);
  console.error('Error info:', info);

  // Send error to monitoring service (if implemented)
  try {
    // Example: errorMonitoringService.reportError(error);
    localStorage.setItem('lastError', JSON.stringify({
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Error reporting failure:', e);
  }
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

// Setup storage event listener for auth sync across tabs
window.addEventListener("storage", (event) => {
  if (
    event.key === AUTH_CONFIG.TOKEN_KEY ||
    event.key === AUTH_CONFIG.USER_KEY
  ) {
    console.log("Auth storage changed in another tab, syncing state");

    // Dispatch a custom event that our app can listen for
    window.dispatchEvent(
      new CustomEvent("auth-storage-changed", {
        detail: { key: event.key, newValue: event.newValue },
      })
    );
  }
});

// Get or create the root element
const getRootElement = () => {
  let rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found, creating one");
    rootElement = document.createElement("div");
    rootElement.id = "root";
    document.body.appendChild(rootElement);
  }
  return rootElement;
};

// Render application
const renderApp = () => {
  // Ensure portal root exists before rendering
  try {
    ensurePortalRoot();
  } catch (error) {
    console.error("Error initializing portal root:", error);
  }

  try {
    // React 18 API
    const root = ReactDOM.createRoot(getRootElement());
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error rendering with React 18 API:", error);

    // Fallback to simple rendering
    try {
      const rootDiv = getRootElement();
      rootDiv.innerHTML = "";

      // Display fallback message
      const message = document.createElement("div");
      message.innerHTML =
        "<h1>Harmonic Universe</h1><p>Application is loading...</p>";
      rootDiv.appendChild(message);
    } catch (fallbackError) {
      console.error("Complete render failure:", fallbackError);
      getRootElement().innerHTML =
        "<div><h1>Harmonic Universe</h1><p>Application failed to initialize. Please try again later.</p></div>";
    }
  }
};

// Initialize the application
const init = async () => {
  try {
    // Initialize portal root
    const portalRoot = document.getElementById("portal-root");
    if (!portalRoot) {
      const newPortalRoot = document.createElement("div");
      newPortalRoot.id = "portal-root";
      document.body.appendChild(newPortalRoot);
    }

    // Render the application
    renderApp();
  } catch (error) {
    console.error("Error initializing application:", error);
  }
};

// Initialize the application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
