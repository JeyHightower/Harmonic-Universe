import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  checkAuthState,
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../../store/slices/authSlice";
import { demoLogin } from "../../../store/thunks/authThunks";
import { AUTH_CONFIG, IS_DEVELOPMENT } from "../../../utils/config";
import Button from "../../../components/common/Button";
import "../../../styles/Home.css";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    console.debug("Home component mounted");
    // Only check auth state if we have a token
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      dispatch(checkAuthState());
    }
  }, [dispatch]);

  useEffect(() => {
    console.debug("Auth state updated:", { isAuthenticated, loading });
    if (isAuthenticated && !loading) {
      console.debug("Redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleDemoLogin = async () => {
    try {
      console.debug("[Home] Starting demo login process");
      dispatch(loginStart());

      // Direct fallback for production - skip API call on render.com
      if (window.location.hostname.includes("render.com")) {
        console.log(
          "[Home] Production environment detected, using immediate fallback"
        );
        createAndLoginDemoUser();
        return;
      }

      // Try the API call for development or other environments
      try {
        // Make demo login request
        const resultAction = await dispatch(demoLogin());

        if (IS_DEVELOPMENT) {
          console.debug("[Home] Demo login result:", resultAction);
        }

        if (demoLogin.fulfilled.match(resultAction)) {
          console.debug("[Home] Demo login successful via thunk");
          // The demoLogin thunk already handles token storage and state updates
          setTimeout(() => {
            console.debug(
              "[Home] Navigating to dashboard after API demo login"
            );
            navigate("/dashboard", { replace: true });
          }, 500);
          return;
        }

        // API call failed, fall back to direct login
        console.warn("[Home] Demo login thunk unsuccessful, using fallback");
        createAndLoginDemoUser();
      } catch (apiError) {
        console.error("[Home] Error calling demo login API:", apiError);
        createAndLoginDemoUser();
      }
    } catch (error) {
      console.error("[Home] Demo login process failed:", error);

      // Absolute last resort
      try {
        const demoUser = {
          id: "demo-emergency",
          username: "demo",
          email: "demo@example.com",
        };
        const token = "emergency-token-" + Date.now();

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

        // Use direct Redux action dispatch
        dispatch({
          type: "auth/loginSuccess",
          payload: { user: demoUser, token },
        });

        console.log("[Home] Emergency fallback login successful");
        navigate("/dashboard", { replace: true });
      } catch (finalError) {
        console.error("[Home] All fallback methods failed:", finalError);
        dispatch(loginFailure("Could not log in as demo user"));
      }
    }
  };

  // Helper function to create and log in a demo user
  function createAndLoginDemoUser() {
    try {
      console.debug(
        "[Home] createAndLoginDemoUser called - Creating demo user and logging in"
      );
      // Create a demo user
      const demoUser = {
        id: "demo-user-" + Math.random().toString(36).substring(2, 7),
        username: "demo",
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create a mock token
      const mockToken =
        "demo-token-" + Math.random().toString(36).substring(2, 15);

      // Store in localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

      // Dispatch login success
      dispatch(
        loginSuccess({
          user: demoUser,
          token: mockToken,
        })
      );

      console.log("[Home] Direct demo login successful");

      // Use setTimeout to ensure auth state has time to update
      setTimeout(() => {
        console.debug("[Home] Navigating to dashboard after demo login");
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      console.error("[Home] Failed to create demo user:", error);
      throw error; // Let the main try/catch handle it
    }
  }

  console.debug("Rendering Home component:", { isAuthenticated, loading });

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Loading...</p>
          <small>Please wait while we check your session.</small>
        </div>
      </div>
    );
  }

  // If authenticated, the useEffect will handle redirect
  if (isAuthenticated) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Redirecting to dashboard...</p>
          <small>Please wait while we redirect you.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Harmonic Universe</h1>
        <p>
          Experience the perfect harmony of sound and physics in an immersive
          environment. Create, explore, and discover the beauty of musical
          universes.
        </p>
        <div className="home-actions">
          <Button onClick={handleDemoLogin} variant="primary">
            Try Demo
          </Button>
          <Link to="/demo-login" className="try-demo-direct">
            <Button variant="secondary">Try Demo (Alternative)</Button>
          </Link>
        </div>
      </div>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Create Universes</h3>
          <p>
            Design your own musical universes with unique physics parameters and
            sound profiles.
          </p>
        </div>
        <div className="feature-card">
          <h3>Interactive Physics</h3>
          <p>
            Experiment with 2D and 3D physics simulations that respond to your
            musical creations.
          </p>
        </div>
        <div className="feature-card">
          <h3>Sound Design</h3>
          <p>
            Craft beautiful soundscapes with our advanced audio generation and
            manipulation tools.
          </p>
        </div>
        <div className="feature-card">
          <h3>Visual Experience</h3>
          <p>
            Watch your music come to life with stunning visualizations and
            animations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
