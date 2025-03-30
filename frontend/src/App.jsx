import React, { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";

// Define a fallback component in case of errors
const ErrorFallback = () => (
  <div
    style={{
      padding: "2rem",
      margin: "2rem auto",
      maxWidth: "600px",
      textAlign: "center",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }}
  >
    <h1>Something went wrong</h1>
    <p>We're having trouble loading the application. Please try again later.</p>
  </div>
);

// Create a separate component for the main app content
const AppContent = () => {
  try {
    // Import and use components from your application
    return (
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <div className="App">
          <header className="App-header">
            <h1>Harmonic Universe</h1>
          </header>
          <main>
            <Routes>
              <Route
                path="/"
                element={<div>Welcome to Harmonic Universe</div>}
              />
              {/* Your other routes should go here */}
            </Routes>
          </main>
          <footer className="App-footer">
            <p>&copy; {new Date().getFullYear()} Harmonic Universe</p>
          </footer>
        </div>
      </BrowserRouter>
    );
  } catch (error) {
    console.error("Error rendering app content:", error);
    return <ErrorFallback />;
  }
};

// The main App component
function App() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Log that the component has mounted successfully
    console.log("App component mounted successfully");
    return () => {
      console.log("App component unmounted");
    };
  }, []);

  // Error boundary functionality
  if (hasError) {
    return <ErrorFallback />;
  }

  try {
    return (
      <Provider store={store}>
        <AppContent />
      </Provider>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    setHasError(true);
    return <ErrorFallback />;
  }
}

// Export the App component - this is now outside all blocks
export default App;
