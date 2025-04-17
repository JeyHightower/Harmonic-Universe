import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { demoLogin } from "../../../utils/demoLogin";
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

      await demoLogin(dispatch);

      setLoading(false);
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
