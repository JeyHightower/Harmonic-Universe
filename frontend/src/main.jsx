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
import "./styles/modal.css"; // Seventh: Modal styles
import "./styles/index.css"; // Eighth: Additional global styles
// App.css comes last so it can override component-specific styles if needed
import "./styles/App.css";
import { ensurePortalRoot } from "./utils/portalUtils";

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
    console.error("Root element not found. Application cannot start.");
    return;
  }

  // Create root only once
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Application mounted successfully");
};

// Initialize the application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
