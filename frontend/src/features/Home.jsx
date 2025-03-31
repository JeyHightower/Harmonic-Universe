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
      const resultAction = await dispatch(demoLogin());
      if (demoLogin.fulfilled.match(resultAction)) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("[Home] Demo login failed:", error);
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
