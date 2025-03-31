import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { demoLogin } from "../../store/thunks/authThunks";
import { ModalSystem } from "../modals";
import { MODAL_CONFIG } from "../../utils/config";
import "./Auth.css";
import PropTypes from "prop-types";

const DemoLogin = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
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

  const handleDemoLogin = async () => {
    try {
      // Show loading indicator or message
      console.log("DemoLogin - Logging in as demo user...");
      setIsLoading(true);
      setError(null);

      // Dispatch the demo login action
      const resultAction = await dispatch(demoLogin());
      console.log("DemoLogin - Demo login result:", resultAction);

      if (demoLogin.fulfilled.match(resultAction)) {
        console.log(
          "DemoLogin - Demo login successful, will navigate when auth state updates"
        );
        // Navigation is handled by the useEffect above
      } else {
        // Demo login failed, show error
        console.error("DemoLogin - Demo login failed:", resultAction);

        // Extract a meaningful error message
        let errorMessage = "Login failed. Please try again.";
        if (resultAction.payload?.message) {
          errorMessage = resultAction.payload.message;
        } else if (resultAction.error?.message) {
          errorMessage = resultAction.error.message;
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error("DemoLogin - Error during demo login:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        originalError: error,
      });

      // Fallback to offline authentication if there was an error
      try {
        console.log("DemoLogin - Attempting fallback authentication directly");
        // Import AUTH_CONFIG and handleOfflineAuthentication directly
        const { handleOfflineAuthentication } = await import(
          "../../utils/authFallback"
        );
        const { AUTH_CONFIG } = await import("../../utils/config");

        const fallbackData = handleOfflineAuthentication();
        console.log("DemoLogin - Fallback data:", fallbackData);

        // Store tokens from fallback using the correct key names
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, fallbackData.token);
        if (fallbackData.refresh_token) {
          localStorage.setItem(
            AUTH_CONFIG.REFRESH_TOKEN_KEY,
            fallbackData.refresh_token
          );
        }
        localStorage.setItem(
          AUTH_CONFIG.USER_KEY,
          JSON.stringify(fallbackData.user)
        );

        // Dispatch loginSuccess directly
        dispatch({
          type: "auth/loginSuccess",
          payload: {
            user: fallbackData.user,
            token: fallbackData.token,
            refresh_token: fallbackData.refresh_token,
          },
        });

        // Navigation will be handled by the useEffect that watches auth state
      } catch (fallbackError) {
        console.error(
          "DemoLogin - Fallback authentication failed:",
          fallbackError
        );
        setError("Failed to authenticate. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleDemoLogin();
  };

  return (
    <ModalSystem
      isOpen={true}
      onClose={onClose}
      title="Demo Login"
      size={MODAL_CONFIG.SIZES.MEDIUM}
      type="form"
      showCloseButton={true}
      closeOnEscape={true}
      closeOnBackdrop={true}
      preventBodyScroll={true}
      animation={MODAL_CONFIG.ANIMATIONS.FADE}
    >
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
    </ModalSystem>
  );
};

DemoLogin.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default DemoLogin;
