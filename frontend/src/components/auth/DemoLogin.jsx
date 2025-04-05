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
      console.log("DemoLogin - User authenticated, navigating to dashboard");
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  const createLocalDemoUser = () => {
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

    const mockToken =
      "demo-token-" + Math.random().toString(36).substring(2, 15);

    return {
      user: demoUser,
      token: mockToken,
      message: "Demo login successful",
    };
  };

  const handleDemoLogin = async () => {
    try {
      console.log("DemoLogin Page - Starting demo login process");
      setIsLoading(true);
      setError(null);

      // For production environments, especially on Render.com, use local demo user
      if (window.location.hostname.includes("render.com")) {
        console.log(
          "DemoLogin - Render.com environment detected, using direct login"
        );
        const demoData = createLocalDemoUser();

        // Store in localStorage
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, demoData.token);
        localStorage.setItem(
          AUTH_CONFIG.USER_KEY,
          JSON.stringify(demoData.user)
        );

        // Update Redux state
        dispatch(
          loginSuccess({
            user: demoData.user,
            token: demoData.token,
          })
        );

        console.log("DemoLogin - Direct login successful");
        // Navigation will happen via the useEffect
        return;
      }

      // For non-production environments, try the regular flow
      try {
        console.log("DemoLogin - Dispatching regular demoLogin thunk");
        const resultAction = await dispatch(demoLogin());
        console.log("DemoLogin - Demo login result:", resultAction);

        if (demoLogin.fulfilled.match(resultAction)) {
          console.log("DemoLogin - Demo login successful via thunk");
          // Navigation is handled by the useEffect above
          return;
        }

        // If we get here, the thunk didn't succeed but didn't throw an error
        console.warn("DemoLogin - Thunk didn't succeed, using fallback");
        useLocalFallback();
      } catch (apiError) {
        console.error("DemoLogin - Error during demoLogin dispatch:", apiError);
        useLocalFallback();
      }
    } catch (error) {
      console.error("DemoLogin - Error during demo login:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Last resort fallback
      try {
        console.log("DemoLogin - Using last resort fallback");
        const demoData = createLocalDemoUser();

        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, demoData.token);
        localStorage.setItem(
          AUTH_CONFIG.USER_KEY,
          JSON.stringify(demoData.user)
        );

        dispatch({
          type: "auth/loginSuccess",
          payload: {
            user: demoData.user,
            token: demoData.token,
          },
        });

        console.log("DemoLogin - Last resort fallback successful");
      } catch (finalError) {
        console.error("DemoLogin - All fallbacks failed:", finalError);
        setError("Failed to authenticate. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const useLocalFallback = () => {
    try {
      console.log("DemoLogin - Using local fallback");
      const demoData = createLocalDemoUser();

      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, demoData.token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoData.user));

      dispatch(
        loginSuccess({
          user: demoData.user,
          token: demoData.token,
        })
      );

      console.log("DemoLogin - Local fallback successful");
    } catch (fallbackError) {
      console.error("DemoLogin - Local fallback failed:", fallbackError);
      throw fallbackError; // Let the outer catch handle it
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
              <p>Redirecting to dashboard...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If used as a modal
  return (
    <div className="auth-form">
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
        <p>Redirecting to dashboard...</p>
      )}
    </div>
  );
};

DemoLogin.propTypes = {
  onClose: PropTypes.func,
};

DemoLogin.defaultProps = {
  onClose: null,
};

export default DemoLogin;
