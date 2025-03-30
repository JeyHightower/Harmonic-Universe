import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { useSelector } from "react-redux";
import { Home, Login, Register, Modal, Navigation } from "./components";
import "./styles/App.css";

// Lazy load route components
const Dashboard = lazy(() => import("./components/pages/Dashboard"));
const Profile = lazy(() => import("./components/pages/Profile"));
const SettingsPage = lazy(() => import("./components/pages/SettingsPage"));

// Loading component for Suspense fallback
const LoadingPage = () => (
  <div className="loading-page">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

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

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Create a separate component for the main app content
const AppContent = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isOpen, type } = useSelector((state) => state.modal);

  const renderModalContent = () => {
    switch (type) {
      case "LOGIN":
        return (
          <Login onClose={() => store.dispatch({ type: "modal/closeModal" })} />
        );
      case "REGISTER":
        return (
          <Register
            onClose={() => store.dispatch({ type: "modal/closeModal" })}
          />
        );
      default:
        return null;
    }
  };

  try {
    return (
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <div className="App">
          <Navigation />
          <main className="App-main">
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <footer className="App-footer">
            <p>&copy; {new Date().getFullYear()} Harmonic Universe</p>
          </footer>
          {isOpen && (
            <Modal
              isOpen={isOpen}
              onClose={() => store.dispatch({ type: "modal/closeModal" })}
              type={type}
            >
              {renderModalContent()}
            </Modal>
          )}
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

// Export the App component
export default App;
