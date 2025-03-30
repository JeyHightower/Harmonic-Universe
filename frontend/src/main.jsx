import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import potential CSS files
try {
  // Try to import global CSS or styles
  const cssFiles = [
    "./styles/index.css",
    "./styles/main.css",
    "./styles/global.css",
    "./styles/app.css",
    "./styles.css",
    "./index.css",
  ];

  // Try each possible CSS file
  cssFiles.forEach((file) => {
    try {
      require(file);
    } catch (e) {
      // Silently fail if file doesn't exist
    }
  });
} catch (e) {
  console.warn("Could not import CSS files:", e);
}

// Function to initialize the application
const initializeApp = () => {
  console.log("Initializing Harmonic Universe application...");

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
