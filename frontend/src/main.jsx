import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// CSS imports in correct order to prevent conflicts
import "./styles/reset.css"; // First: Reset browser defaults
import "./styles/variables.css"; // Second: Define CSS variables
import "./styles/theme.css"; // Third: Define theme variables
import "./styles/global.css"; // Fourth: Global styles
import "./styles/common.css"; // Fifth: Common component styles
import "./styles/buttons.css"; // Sixth: Button styles
// import "./styles/modal.css"; // Seventh: Modal styles - commented out as it may not exist
import "./styles/index.css"; // Eighth: Additional global styles
// App.css comes last so it can override component-specific styles if needed
import "./styles/App.css";
import { ensurePortalRoot } from "./utils/portalUtils";

// Environment setup
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

// Log environment
if (isDev) {
  console.log(
    `Running in ${isLocal ? "local" : ""} ${isDev ? "development" : ""} mode`
  );
}

// Setup error handling
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error caught", {
    message,
    source,
    lineno,
    colno,
    error,
  });

  // Optionally send to error tracking service in production
  if (isProd) {
    // Example: errorTrackingService.logError(error);
  }

  // Don't prevent default error handling
  return false;
};

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

// Render application with fallbacks
const renderApp = () => {
  console.log("Initializing Harmonic Universe application...");

  // Ensure portal root exists before rendering
  try {
    const portalRoot = ensurePortalRoot();
    console.log("Portal root initialized:", portalRoot);
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
    console.log("Application mounted successfully");
  } catch (error) {
    console.error("Error rendering with React 18 API:", error);

    // Fallback to simple rendering
    try {
      const appElement = React.createElement(App);
      const rootDiv = getRootElement();
      rootDiv.innerHTML = "";

      // Display fallback message
      const message = document.createElement("div");
      message.innerHTML =
        "<h1>Harmonic Universe</h1><p>Application is loading...</p>";
      rootDiv.appendChild(message);

      console.log("App rendered with fallback method");
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
    console.log("Initializing Harmonic Universe application...");

    // Log the current location for debugging routing issues
    console.log(`Current location: ${window.location.pathname}`);

    // Check for scenes edit path specifically
    if (
      window.location.pathname.includes("/scenes/") &&
      window.location.pathname.includes("/edit")
    ) {
      console.log("Scene edit path detected. Ensuring proper routing...");
    }

    // Initialize portal root
    const portalRoot = document.getElementById("portal-root");
    if (!portalRoot) {
      const newPortalRoot = document.createElement("div");
      newPortalRoot.id = "portal-root";
      document.body.appendChild(newPortalRoot);
      console.log("Portal root created dynamically");
    } else {
      console.log("Portal root initialized:", portalRoot);
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
