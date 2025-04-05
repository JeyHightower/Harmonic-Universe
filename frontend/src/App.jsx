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
  Outlet,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./store/store";
import { useSelector, useDispatch } from "react-redux";
import { Navigation } from "./components";
// Import Home using lazy loading to match the routes file
const Home = lazy(() => import("./pages/Home"));
import ModalProvider from "./components/modals/ModalProvider";
import routes from "./routes";
import { checkAuthState, logout } from "./store/slices/authSlice";
import { AUTH_CONFIG } from "./utils/config";
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
  return <Home />;
};

// Create a separate component for the main app content
const AppContent = () => {
  const auth = useSelector((state) => state.auth);
  const { isAuthenticated, user, isLoading } = auth;
  const dispatch = useDispatch();
  const [isPending, startTransition] = useTransition();
  const [routeElements, setRouteElements] = useState(null);

  // Check auth state when component mounts
  useEffect(() => {
    console.log("AppContent - Checking auth state");

    // Check if auth tokens and user data are in local storage
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);

    console.log("AppContent - Auth check:", {
      hasToken: !!token,
      hasUserData: !!userData,
      tokenLength: token ? token.length : 0,
    });

    // Only dispatch checkAuthState if we have necessary data
    if (token && userData) {
      try {
        // Verify user data is valid JSON
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData && parsedUserData.id) {
          console.log(
            "AppContent - Valid token and user data found, checking auth state"
          );
          dispatch(checkAuthState());
        } else {
          console.warn("AppContent - User data parsed but invalid format");
          dispatch(logout());
        }
      } catch (e) {
        console.error("AppContent - Error parsing user data:", e.message);
        dispatch(logout());
      }
    } else {
      console.warn("AppContent - Missing auth data, cannot check auth state");
      // If no token or user data, dispatch logout to ensure clean state
      dispatch(logout());
    }
  }, [dispatch]);

  // Listen for storage events (which we might dispatch manually)
  useEffect(() => {
    const handleStorageChange = (event) => {
      console.log("AppContent - Storage changed, checking auth state", event);

      // If the token or user data changed, check auth state
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
          console.warn("AppContent - Missing auth data after storage event");
          dispatch(logout());
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Set up route elements with startTransition to prevent suspension during synchronous updates
  useEffect(() => {
    if (!isLoading) {
      startTransition(() => {
        setRouteElements(
          routes.map((route, index) => (
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
          ))
        );
      });
    }
  }, [isLoading, isAuthenticated]); // Re-create routes when auth state changes

  // Simplified auth key to avoid excessive re-renders
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
                  {/* First add an explicit route to handle the root path with query params */}
                  <Route path="/" element={<RootPathHandler />} />
                  {/* Then add all the other routes */}
                  {routeElements}
                </>
              )}
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
