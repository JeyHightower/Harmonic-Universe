import React, {
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
import { Outlet } from "react-router-dom";
import { ModalProvider } from "../../contexts/ModalContext";
import { MODAL_TYPES } from "../../constants/modalTypes";
import { useModal } from "../../contexts/ModalContext";

// Import safe versions of hooks
import {
  safeUseLocation,
  safeUseNavigate,
} from "../../utils/ensure-router-provider";
import { safeUseDispatch } from "../../utils/ensure-redux-provider";
import { safeImport } from "../../utils/dynamic-import";
import { ensureRouterProvider } from "../../utils/ensure-router-provider";

// Import demoLogin with fallback
let demoLogin;
try {
  // Use dynamic import instead of require
  import("../../store/slices/authSlice")
    .then((module) => {
      demoLogin = module.demoLogin;
    })
    .catch((error) => {
      console.warn("demoLogin not available, using fallback");
      demoLogin = () => {
        console.error("Demo login not implemented");
        return { type: "auth/demoLogin/rejected", error: "Not implemented" };
      };
    });

  // Initialize with fallback in case the import hasn't resolved yet
  demoLogin = () => {
    console.error("Demo login not implemented");
    return { type: "auth/demoLogin/rejected", error: "Not implemented" };
  };
} catch (error) {
  console.warn("demoLogin not available, using fallback");
  demoLogin = () => {
    console.error("Demo login not implemented");
    return { type: "auth/demoLogin/rejected", error: "Not implemented" };
  };
}

// Navbar with React.lazy for code splitting
const NavbarFallback = () => (
  <header
    className="navbar-fallback"
    style={{
      padding: "10px 20px",
      backgroundColor: "#f0f0f0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Harmonic Universe</h1>
  </header>
);

// Use React.lazy instead of require
const Navbar = lazy(() =>
  import("./Navbar").catch((error) => {
    console.warn("[Layout] Navbar component not available, using fallback");
    return { default: NavbarFallback };
  })
);

// Footer with React.lazy for code splitting
const FooterFallback = () => (
  <footer
    className="footer-fallback"
    style={{
      padding: "10px 20px",
      backgroundColor: "#f0f0f0",
      textAlign: "center",
      marginTop: "auto",
    }}
  >
    <p style={{ margin: 0 }}>
      Harmonic Universe &copy; {new Date().getFullYear()}
    </p>
  </footer>
);

// Use React.lazy instead of require
const Footer = lazy(() =>
  import("../layout/Footer").catch((error) => {
    console.warn("[Layout] Footer component not available, using fallback");
    return { default: FooterFallback };
  })
);

// Content error boundary to catch and handle errors in child components
class ContentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[Layout] Error caught in ContentErrorBoundary:", error);
    console.error("[Layout] Error info:", info);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-container"
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#ffdddd",
            borderRadius: "5px",
            margin: "20px 0",
          }}
        >
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering the content.</p>
          <p>Error: {this.state.error?.message || "Unknown error"}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 15px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe wrapper for React Router Outlet
function SafeOutlet() {
  try {
    return <Outlet />;
  } catch (error) {
    console.error("[Layout] Error rendering Outlet:", error);
    return (
      <div className="outlet-error">
        <h2>Navigation Error</h2>
        <p>An error occurred when trying to render the route content.</p>
        <p>Error: {error.message}</p>
      </div>
    );
  }
}

// Main Layout component with enhanced error handling
function Layout() {
  // Use safe versions of hooks
  const location = safeUseLocation();
  const navigate = safeUseNavigate();
  const dispatch = safeUseDispatch();
  const { openModal } = useModal();

  // Local state for component needs
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Add ref to track if we've handled parameters
  const hasHandledParams = useRef(false);

  // Handle demo login with error handling
  const handleDemoLogin = useCallback(async () => {
    if (!dispatch || typeof demoLogin !== "function") {
      console.error("[Layout] Redux dispatch or demoLogin not available");
      return;
    }

    console.log("[Layout] Executing demo login...");

    try {
      console.log("[Layout] Dispatching demo login action");
      const resultAction = await dispatch(demoLogin());

      if (resultAction.meta?.requestStatus === "fulfilled") {
        console.log("[Layout] Demo login successful, navigating to dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        console.error("[Layout] Demo login failed:", resultAction.error);
      }
    } catch (error) {
      console.error("[Layout] Error during demo login:", error);
    }
  }, [dispatch, navigate, demoLogin]);

  // Log component mount
  useEffect(() => {
    console.log("[Layout] Component mounted successfully");

    // Log available contexts and hooks
    console.log("[Layout] Context check:", {
      location: !!location,
      navigate: !!navigate,
      dispatch: !!dispatch,
      openModal: !!openModal,
    });

    // Set initialized to true after component mounts
    setInitialized(true);

    return () => {
      console.log("[Layout] Component unmounted");
    };
  }, [openModal]);

  // Handle URL parameters for modals and demo login
  useEffect(() => {
    if (!dispatch || hasHandledParams.current) {
      return; // Exit early if dependencies aren't available or we've already handled params
    }

    try {
      const searchParams = new URLSearchParams(location.search);
      const modalParam = searchParams.get("modal");
      const demoParam = searchParams.get("demo");

      // Handle modal parameter
      if (modalParam && openModal) {
        console.log("[Layout] Detected modal parameter:", modalParam);
        if (modalParam === "login") {
          openModal(MODAL_TYPES.LOGIN);
        } else if (modalParam === "signup") {
          openModal(MODAL_TYPES.SIGNUP);
        }
      }

      // Handle demo parameter
      if (demoParam === "true") {
        console.log("[Layout] Detected demo parameter");
        handleDemoLogin();
      }

      // Mark parameters as handled
      hasHandledParams.current = true;
    } catch (error) {
      console.error("[Layout] Error handling URL parameters:", error);
      setError(error);
    }
  }, [location, dispatch, handleDemoLogin, openModal]);

  // Render loading state
  if (!initialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Something went wrong</h2>
        <p>Error: {error.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <div className="layout">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <main className="main-content">
        <ContentErrorBoundary>
          <SafeOutlet />
        </ContentErrorBoundary>
      </main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
}

// Export Layout directly instead of wrapping with ModalProvider
export default Layout;
