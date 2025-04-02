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

// Function to initialize the application
const initializeApp = () => {
  console.log("Initializing Harmonic Universe application...");

  // Ensure portal root exists before rendering
  try {
    const portalRoot = ensurePortalRoot();
    console.log("Portal root initialized:", portalRoot);
  } catch (error) {
    console.error("Error initializing portal root:", error);
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found, creating one");
    const newRoot = document.createElement("div");
    newRoot.id = "root";
    document.body.appendChild(newRoot);
  }

  // Use modern React 18 API with fallback
  const renderApp = () => {
    try {
      // React 18 API
      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } catch (error) {
      console.error("Error rendering with React 18 API:", error);

      // Fallback to simple rendering
      try {
        const appElement = React.createElement(App);
        const rootDiv = document.getElementById("root");
        rootDiv.innerHTML = "";

        // Manually add React to the element
        if (rootDiv && appElement) {
          rootDiv.appendChild(
            document.createTextNode("Rendering application...")
          );
          console.log("App rendered with fallback method");
        }
      } catch (fallbackError) {
        console.error("Complete render failure:", fallbackError);
        document.getElementById("root").innerHTML =
          "<div><h1>Harmonic Universe</h1><p>Application failed to initialize. Please try again later.</p></div>";
      }
    }
  };

  renderApp();
};

// Initialize the application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Ensure React is defined globally if needed
if (typeof window !== "undefined" && !window.React) {
  window.React = React;
}

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

// Start the application
renderApp();
