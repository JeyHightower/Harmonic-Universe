import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { demoLogin } from "../../store/thunks/authThunks";
import { loginSuccess } from "../../store/slices/authSlice";
import { AUTH_CONFIG } from "../../utils/config";
import "./Auth.css";
import PropTypes from "prop-types";

const DemoLogin = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    // Log page load
    console.log("DemoLogin Component - Mounted, will auto-login");

    // Automatically trigger demo login when component mounts
    handleDemoLogin();
  }, []);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      console.log(
        "DemoLogin - User authenticated, preparing to navigate to dashboard",
        {
          isAuthenticated: auth.isAuthenticated,
          userId: auth.user?.id,
          hasToken: !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY),
          hasUserInStorage: !!localStorage.getItem(AUTH_CONFIG.USER_KEY),
          user: auth.user,
        }
      );

      // Trigger storage event to notify other components about auth state change
      window.dispatchEvent(new Event("storage"));

      setTimeout(() => {
        console.log("DemoLogin - Now navigating to dashboard after delay");
        navigate("/dashboard");
      }, 1000); // Increased timeout for more stability
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  const handleDemoLogin = async () => {
    try {
      console.log("DemoLogin Page - Starting demo login process");
      setIsLoading(true);
      setError(null);

      // First check if we already have a token to avoid unnecessary login attempts
      const existingToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const existingUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);

      if (existingToken && existingUser) {
        console.log(
          "DemoLogin - Found existing token and user data, attempting to use it"
        );
        try {
          const userData = JSON.parse(existingUser);

          // Update Redux state with existing data
          dispatch(
            loginSuccess({
              user: userData,
              token: existingToken,
            })
          );

          console.log(
            "DemoLogin - Successfully restored session from localStorage"
          );
          setIsLoading(false);
          return;
        } catch (parseError) {
          console.error(
            "DemoLogin - Error parsing existing user data:",
            parseError
          );
          // Continue with normal login if parsing fails
        }
      }

      // Dispatch the demo login action
      console.log("DemoLogin - Making API request for demo login");
      const resultAction = await dispatch(demoLogin());
      console.log("DemoLogin - Demo login result:", resultAction);

      if (demoLogin.fulfilled.match(resultAction)) {
        console.log("DemoLogin - Demo login successful via thunk");

        // Double-check localStorage has token and user data
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);

        console.log("DemoLogin - LocalStorage after login:", {
          hasToken: !!token,
          hasUserData: !!userData,
          tokenLength: token ? token.length : 0,
        });

        if (!token || !userData) {
          console.warn(
            "DemoLogin - Token or user data missing after successful login, manually storing"
          );

          // Manually store data if missing
          if (resultAction.payload && resultAction.payload.token) {
            localStorage.setItem(
              AUTH_CONFIG.TOKEN_KEY,
              resultAction.payload.token
            );
          }

          if (resultAction.payload && resultAction.payload.user) {
            localStorage.setItem(
              AUTH_CONFIG.USER_KEY,
              JSON.stringify(resultAction.payload.user)
            );
          }

          // Manually dispatch login success again to ensure Redux state is updated
          if (resultAction.payload) {
            dispatch(loginSuccess(resultAction.payload));
          }
        }

        // Navigation is handled by the useEffect above
        return;
      } else {
        // If the thunk didn't succeed and didn't throw an error
        console.warn(
          "DemoLogin - Thunk didn't succeed, error:",
          resultAction.error
        );
        setError("Demo login failed. Please try again.");
      }
    } catch (error) {
      console.error("DemoLogin - Error during demo login:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      setError("Failed to authenticate. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleDemoLogin();
  };

  // If used as a page (not a modal)
  if (!onClose) {
    return (
      <div className="demo-login-page">
        <div className="auth-container">
          <div className="auth-card">
            <h2>Demo Login</h2>
            {isLoading ? (
              <>
                <p>Logging you in as a demo user...</p>
                <div className="loading-spinner"></div>
              </>
            ) : error ? (
              <>
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="button button-primary">
                  Retry Login
                </button>
              </>
            ) : (
              <p>Successfully logged in! Redirecting to dashboard...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Used as a modal
  return (
    <div className="demo-login-modal">
      <h2>Demo Login</h2>
      {isLoading ? (
        <>
          <p>Logging you in as a demo user...</p>
          <div className="loading-spinner"></div>
        </>
      ) : error ? (
        <>
          <p className="error-message">{error}</p>
          <div className="modal-actions">
            <button onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button onClick={handleRetry} className="button button-primary">
              Retry Login
            </button>
          </div>
        </>
      ) : (
        <p>Successfully logged in! Redirecting to dashboard...</p>
      )}
    </div>
  );
};

DemoLogin.propTypes = {
  onClose: PropTypes.func,
};

export default DemoLogin;
