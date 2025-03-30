import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkAuthState,
  loginFailure,
  loginStart,
  loginSuccess,
} from "../store/slices/authSlice";
import { openModal } from "../store/slices/modalSlice";
import { api } from "../services/api";
import { endpoints } from "../services/endpoints";
import { AUTH_CONFIG } from "../utils/config";
import Button from "../components/common/Button";
import "../styles/Home.css";

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
      console.debug("Starting demo login process");
      dispatch(loginStart());

      // Make demo login request
      const response = await api.demoLogin();
      console.debug("Demo login response:", response);

      if (!response?.data?.token) {
        throw new Error("Invalid response from demo login endpoint");
      }

      // Store the token and user data
      const token = response.data.token;
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(
        AUTH_CONFIG.USER_KEY,
        JSON.stringify(response.data.user)
      );

      console.debug("Token stored:", token.substring(0, 10) + "...");
      console.debug("User data stored:", response.data.user);

      // Wait a brief moment to ensure token is set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch user info after successful login
      try {
        console.debug("Fetching user profile with token");
        const userResponse = await api.getUserProfile();
        console.debug("User profile response:", userResponse);

        if (!userResponse?.data?.message || !userResponse?.data?.profile) {
          throw new Error(
            "Invalid response structure from user profile endpoint"
          );
        }

        dispatch(loginSuccess(userResponse.data.profile));
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          data: error.data,
        });
        // Don't throw here, as the login was successful
        // Instead, use the user data from the demo login response
        dispatch(loginSuccess(response.data.user));
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Demo login error:", error);
      dispatch(loginFailure(error.message));
    }
  };

  const handleLogin = () => {
    dispatch(openModal({ type: "LOGIN" }));
  };

  const handleRegister = () => {
    dispatch(openModal({ type: "REGISTER" }));
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
          <Button onClick={handleLogin} variant="secondary">
            Login
          </Button>
          <Button onClick={handleRegister} variant="secondary">
            Register
          </Button>
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
