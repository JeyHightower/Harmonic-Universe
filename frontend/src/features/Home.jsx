import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../contexts/ModalContext";
import { demoLogin } from "../store/thunks/authThunks";
import "../styles/Home.css";
import { MODAL_TYPES } from "../constants/modalTypes";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModal();

  useEffect(() => {
    console.log("[Home] Component mounted");
    console.log("[Home] Modal context available:", !!openModal);
  }, [openModal]);

  const handleDemoLogin = async () => {
    console.log("[Home] Demo login button clicked");
    try {
      console.log("[Home] Dispatching demoLogin action");
      const resultAction = await dispatch(demoLogin());
      console.log("[Home] demoLogin result:", resultAction);

      if (demoLogin.fulfilled.match(resultAction)) {
        console.log("[Home] Demo login successful, navigating to dashboard");

        // Use a slight delay to allow state updates to propagate
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else if (resultAction.error) {
        console.error("[Home] Demo login failed with error:", {
          name: resultAction.error.name,
          message: resultAction.error.message,
          payload: resultAction.payload,
          stack: resultAction.error.stack,
        });
      }
    } catch (error) {
      // Improved error logging with more details
      console.error("[Home] Demo login failed:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        originalError: error,
      });
    }
  };

  const handleLogin = () => {
    console.log("[Home] Login button clicked");
    try {
      if (!openModal) {
        console.error("[Home] Modal context not initialized");
        return;
      }
      openModal({ type: MODAL_TYPES.LOGIN });
      console.log("[Home] Login modal opened");
    } catch (error) {
      console.error("[Home] Error opening login modal:", error);
    }
  };

  const handleSignup = () => {
    console.log("[Home] Sign up button clicked");
    try {
      if (!openModal) {
        console.error("[Home] Modal context not initialized");
        return;
      }
      openModal({ type: MODAL_TYPES.SIGNUP });
      console.log("[Home] Sign up modal opened");
    } catch (error) {
      console.error("[Home] Error opening sign up modal:", error);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Create, explore, and share your musical worlds</p>
        <div className="cta-buttons">
          <button onClick={handleSignup} className="button button-primary">
            Sign Up
          </button>
          <button onClick={handleLogin} className="button button-secondary">
            Login
          </button>
          <button onClick={handleDemoLogin} className="button button-tertiary">
            Demo Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
