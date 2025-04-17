import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  checkAuthState,
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../../store/slices/authSlice";
import { demoLogin } from "../../../utils/demoLogin";
import { AUTH_CONFIG, IS_DEVELOPMENT } from "../../../utils/config";
import Button from "../../../components/common/Button";
import "../../../styles/Home.css";

// Destructure window.setTimeout to fix linter error
const { setTimeout } = window;

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

      await demoLogin(dispatch);

      console.debug("[Home] Demo login successful");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("[Home] Demo login process failed:", error);
      dispatch(loginFailure("Could not log in as demo user"));
    }
  };

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
