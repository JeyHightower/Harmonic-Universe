import React, {
  useState,
  useEffect,
  Suspense,
  useTransition,
  lazy,
} from "react";
import {
  Routes,
  Route,
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./store/store";
import { useSelector, useDispatch } from "react-redux";
import { Navigation } from "./components";
import ModalProvider from "./components/modals/ModalProvider";
import routes from "./routes/index.jsx";
import { checkAuthState, logout } from "./store/slices/authSlice";
import { AUTH_CONFIG } from "./utils/config";
import { isHardRefresh } from "./utils/browserUtils";
import "./styles"; // Import all styles

// Log routes to debug
console.log("Routes loaded:", routes);

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

// A component to handle the root path with query parameters
const RootPathHandler = () => {
  const location = useLocation();

  // Log that we're handling a URL with query parameters
  useEffect(() => {
    if (location.search) {
      console.log(
        `RootPathHandler: Handling path with query parameters: ${location.pathname}${location.search}`
      );
    }
  }, [location]);

  // Just render the Home component
  const Home = lazy(() => import("./pages/Home"));
  return (
    <Suspense fallback={<LoadingPage />}>
      <Home />
    </Suspense>
  );
};

// Import critical components directly to ensure they're available
const Dashboard = lazy(() => import("./features/Dashboard"));

// Create a component to properly render lazy-loaded Dashboard
const DashboardComponent = () => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Dashboard />
    </Suspense>
  );
};

// Create a separate component for the main app content
const AppContent = () => {
  const auth = useSelector((state) => state.auth);
  const { isAuthenticated, isLoading } = auth;
  const dispatch = useDispatch();
  const [isPending, startTransition] = useTransition();
  const [routeElements, setRouteElements] = useState(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Persist login state on navigation
  useEffect(() => {
    console.log("AppContent - Initial mount, checking persistent auth state");
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);

    // Check if we have auth data but not authenticated in Redux
    if (token && userData && !isAuthenticated) {
      console.log(
        "AppContent - Found stored auth data but not authenticated in Redux, restoring session"
      );
      dispatch(checkAuthState());
    }

    // Listen for auth storage changes from other tabs
    const handleAuthStorageChange = (event) => {
      console.log(
        "AppContent - Auth storage changed event received",
        event.detail
      );
      dispatch(checkAuthState());
    };

    window.addEventListener("auth-storage-changed", handleAuthStorageChange);
    return () => {
      window.removeEventListener(
        "auth-storage-changed",
        handleAuthStorageChange
      );
    };
  }, [dispatch, isAuthenticated]);

  // Check auth state when component mounts
  useEffect(() => {
    console.log("AppContent - Checking auth state");

    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);

    console.log("AppContent - Auth check:", {
      hasToken: !!token,
      hasUserData: !!userData,
      tokenLength: token ? token.length : 0,
    });

    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        console.log("Parsed user data:", parsedUserData);

        if (
          parsedUserData &&
          typeof parsedUserData === "object" &&
          (parsedUserData.id ||
            (parsedUserData.user && parsedUserData.user.id) ||
            (parsedUserData.data && parsedUserData.data.id) ||
            (parsedUserData.data &&
              parsedUserData.data.user &&
              parsedUserData.data.user.id))
        ) {
          console.log(
            "AppContent - Valid token and user data found, checking auth state"
          );
          dispatch(checkAuthState());
        } else {
          console.warn("AppContent - User data parsed but invalid format");
          console.warn("Invalid user data:", parsedUserData);
          if (!isHardRefresh()) {
            dispatch(logout());
          }
        }
      } catch (e) {
        console.error("AppContent - Error parsing user data:", e.message);
        if (!isHardRefresh()) {
          dispatch(logout());
        }
      }
    } else {
      console.info(
        "AppContent - No authentication data found (normal for new sessions)"
      );
      if (initialAuthCheckDone && !isHardRefresh()) {
        console.log(
          "AppContent - Logging out due to missing auth data after initial check"
        );
        dispatch(logout());
      } else {
        console.log(
          "AppContent - Initial load with no auth data - continuing as unauthenticated"
        );
      }
    }

    setInitialAuthCheckDone(true);
  }, [dispatch]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      console.log("AppContent - Storage changed, checking auth state", event);

      if (
        !event.key ||
        event.key === AUTH_CONFIG.TOKEN_KEY ||
        event.key === AUTH_CONFIG.USER_KEY
      ) {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);

        if (token && userData) {
          console.log(
            "AppContent - Auth data found in storage, checking auth state"
          );
          dispatch(checkAuthState());
        } else {
          console.info(
            "AppContent - No authentication data in storage (normal for new sessions)"
          );
          if (initialAuthCheckDone && !isHardRefresh()) {
            console.log(
              "AppContent - Logging out due to missing auth data after storage event"
            );
            dispatch(logout());
          } else {
            console.log(
              "AppContent - Ignoring missing auth data during initial load"
            );
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, initialAuthCheckDone]);

  useEffect(() => {
    if (!isLoading) {
      console.log("Setting up routes with auth state:", isAuthenticated);
      console.log("Routes data:", routes);

      if (!routes || !Array.isArray(routes)) {
        console.error("Routes is not an array:", routes);
        return;
      }

      startTransition(() => {
        try {
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

          console.log("Route components created:", routeComponentsList.length);
          setRouteElements(routeComponentsList);
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
                            lazy(() => import("./pages/CharactersPage"))
                          )}
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  {/* Add direct route for scenes to fix routing issues */}
                  <Route
                    path="/universes/:universeId/scenes"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingPage />}>
                          {React.createElement(
                            lazy(() => import("./pages/ScenesPage"))
                          )}
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  {/* Add direct route for viewing a single scene */}
                  <Route
                    path="/scenes/:sceneId"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingPage />}>
                          {React.createElement(
                            lazy(() =>
                              import("./components/consolidated/SceneDetail")
                            )
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

  useEffect(() => {
    console.log("App component mounted successfully");
    return () => {
      console.log("App component unmounted");
    };
  }, []);

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

// Export the App component
export default App;
