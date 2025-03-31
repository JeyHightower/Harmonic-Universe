import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { useSelector } from "react-redux";
import { Home, Navigation } from "./components";
import { ModalProvider } from "./contexts/ModalContext";
import routes from "./routes";
import "./styles/App.css";

// Lazy load route components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

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

  try {
    return (
      <div className="App">
        <Navigation />
        <main className="App-main">
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element}>
                  {route.children?.map((child, childIndex) => (
                    <Route
                      key={childIndex}
                      index={child.index}
                      path={child.path}
                      element={child.element}
                    />
                  ))}
                </Route>
              ))}
            </Routes>
          </Suspense>
        </main>
        <footer className="App-footer">
          <p>&copy; {new Date().getFullYear()} Harmonic Universe</p>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Error rendering AppContent:", error);
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
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Provider store={store}>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </Provider>
      </BrowserRouter>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    setHasError(true);
    return <ErrorFallback />;
  }
}

// Export the App component
export default App;
