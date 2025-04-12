import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { demoLogin, loginSuccess } from "../../../store/slices/authSlice";
import { AUTH_CONFIG } from "../../../utils/config";
import Logger from "../../../utils/logger";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // Auto-start demo login
  useEffect(() => {
    handleDemoLogin();
  }, []);

  const handleDemoLogin = async () => {
    try {
      Logger.log("auth", "LoginPage - Starting demo login process");
      setLoading(true);
      setError(null);

      // For production deployments, use direct demo user creation
      if (window.location.hostname.includes("render.com")) {
        Logger.log("auth", "LoginPage - Production environment detected, creating demo user directly");

        // Create mock demo user
        const demoUser = {
          id: "demo-" + Math.floor(Math.random() * 10000),
          username: "demo_user",
          email: "demo@example.com",
          role: "user",
          createdAt: new Date().toISOString(),
        };

        // Create mock token
        const mockToken =
          "demo_token_" + Math.random().toString(36).substring(2, 15);

        // Store in localStorage
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

        // Update Redux state
        dispatch(loginSuccess({ user: demoUser, token: mockToken }));

        // Simulate a network delay
        setTimeout(() => {
          setLoading(false);
          // Trigger storage event to notify other components
          window.dispatchEvent(new CustomEvent("storage"));
        }, 500);

        return;
      }

      // Try to use the demo login action
      Logger.log("auth", "LoginPage - Dispatching demoLogin action");
      const resultAction = await dispatch(demoLogin());

      if (
        resultAction.meta &&
        resultAction.meta.requestStatus === "fulfilled"
      ) {
        Logger.log("auth", "LoginPage - Demo login successful");
        setLoading(false);
      } else {
        Logger.log("auth", "LoginPage - Demo login failed, falling back to direct method", { error: resultAction.error });
        // Fall back to direct method
        const demoUser = {
          id: "demo-" + Math.floor(Math.random() * 10000),
          username: "demo_user",
          email: "demo@example.com",
          role: "user",
          createdAt: new Date().toISOString(),
        };

        const mockToken =
          "demo_token_" + Math.random().toString(36).substring(2, 15);

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

        dispatch(loginSuccess({ user: demoUser, token: mockToken }));
        setLoading(false);
      }
    } catch (error) {
      Logger.log("auth", "LoginPage - Error during demo login:", { error: error.message });
      setError("Failed to log in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Demo Login</h2>
          {loading ? (
            <>
              <p>Logging you in automatically...</p>
              <div className="loading-spinner"></div>
            </>
          ) : error ? (
            <>
              <p className="error-message">{error}</p>
              <button
                onClick={handleDemoLogin}
                className="button button-primary"
              >
                Try Again
              </button>
            </>
          ) : (
            <p>Login successful! Redirecting to dashboard...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
