import React, { useState, useEffect, Suspense, useTransition, lazy } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./store";
import { useSelector, useDispatch } from "react-redux";
import { Navigation } from "./components";
import ModalProvider from "./components/modals/ModalProvider";
import routes from "./routes/index.jsx";
import { checkAuthState } from "./store/slices/authSlice";
import { AUTH_CONFIG } from "./utils";
import "./styles"; // Import all styles

// Loading component for Suspense fallback
const LoadingPage = () => (
  <div className="loading-page">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Define a fallback component in case of errors
const ErrorFallback = () => (
  <div className="error-fallback">
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

// A component to handle the root path with query parameters
const RootPathHandler = () => {
  const Home = lazy(() => import("./components/features/home/pages/Home"));
  return (
    <Suspense fallback={<LoadingPage />}>
      <Home />
    </Suspense>
  );
};

// Import dashboard component with lazy loading
const Dashboard = lazy(() => import("./components/features/dashboard/pages/Dashboard"));

// Create a component to properly render lazy-loaded Dashboard
const DashboardComponent = () => (
  <Suspense fallback={<LoadingPage />}>
    <Dashboard />
  </Suspense>
);

// Create a separate component for the main app content
const AppContent = () => {
  const { isAuthenticated, loading: isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isPending, startTransition] = useTransition();
  const [routeElements, setRouteElements] = useState(null);

  // Persist login state on navigation
  useEffect(() => {
    const handleAuthStorageChange = () => dispatch(checkAuthState());
    window.addEventListener("auth-storage-changed", handleAuthStorageChange);
    
    // Check auth state when component mounts
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    
    if (token && userData && !isAuthenticated) {
      dispatch(checkAuthState());
    }
    
    return () => {
      window.removeEventListener("auth-storage-changed", handleAuthStorageChange);
    };
  }, [dispatch, isAuthenticated]);

  // Setup routes when auth state changes
  useEffect(() => {
    if (!isLoading) {
      startTransition(() => {
        try {
          if (routes && Array.isArray(routes)) {
            const routeComponentsList = routes.map((route, index) => (
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
            ));
            setRouteElements(routeComponentsList);
          }
        } catch (error) {
          console.error("Error setting up routes:", error);
        }
      });
    }
  }, [isLoading, isAuthenticated]);

  const authKey = isAuthenticated ? "authenticated" : "unauthenticated";

  if (isLoading) {
    return <LoadingPage />;
  }

  try {
    return (
      <div className="App" key={authKey}>
        <Navigation />
        <main className="App-main">
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              {isPending ? (
                <Route path="*" element={<LoadingPage />} />
              ) : (
                <>
                  <Route path="/" element={<RootPathHandler />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardComponent />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/universes/:universeId/characters"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingPage />}>
                          {React.createElement(
                            lazy(() => import("./components/features/character/pages/CharactersPage"))
                          )}
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/universes/:universeId/scenes"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingPage />}>
                          {React.createElement(
                            lazy(() => import("./components/features/scene/pages/ScenesPage"))
                          )}
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scenes/:sceneId"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingPage />}>
                          {React.createElement(
                            lazy(() => import("./components/features/scene/pages/SceneDetail"))
                          )}
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  {routeElements}
                </>
              )}
            </Routes>
          </Suspense>
        </main>
        <footer className="App-footer">
          <p>© {new Date().getFullYear()} Harmonic Universe</p>
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

  if (hasError) {
    return <ErrorFallback />;
  }

  try {
    return (
      <Provider store={store}>
        <PersistGate loading={<LoadingPage />} persistor={persistor}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ModalProvider>
              <AppContent />
            </ModalProvider>
          </BrowserRouter>
        </PersistGate>
      </Provider>
    );
  } catch (error) {
    console.error("Error rendering App:", error);
    setHasError(true);
    return <ErrorFallback />;
  }
}

export default App;
