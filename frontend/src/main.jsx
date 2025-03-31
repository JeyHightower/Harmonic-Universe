import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/index.css";
import "./styles/App.css";

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
