import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useModal } from "../../contexts/ModalContext";
import { MODAL_TYPES } from "../../constants/modalTypes";
import logoSvg from "../../assets/logo.svg";
import "./Navigation.css";

function Navigation() {
  const { openModal } = useModal();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleLoginClick = useCallback(() => {
    try {
      console.log("[Navigation] Opening login modal");
      openModal(MODAL_TYPES.LOGIN, {
        title: "Login",
        size: "medium",
        position: "center",
        animation: "fade",
        closeOnEscape: true,
        closeOnBackdrop: true,
        preventBodyScroll: true,
        showCloseButton: true,
      });
    } catch (error) {
      console.error("[Navigation] Error opening login modal:", error);
    }
  }, [openModal]);

  const handleSignupClick = useCallback(() => {
    try {
      console.log("[Navigation] Opening signup modal");
      openModal(MODAL_TYPES.SIGNUP, {
        title: "Sign Up",
        size: "medium",
        position: "center",
        animation: "fade",
        closeOnEscape: true,
        closeOnBackdrop: true,
        preventBodyScroll: true,
        showCloseButton: true,
      });
    } catch (error) {
      console.error("[Navigation] Error opening signup modal:", error);
    }
  }, [openModal]);

  return (
    <nav className="navigation">
      <div className="navigation-left">
        <Link to="/" className="logo-link">
          <img
            src={logoSvg}
            alt="Harmonic Universe Logo"
            className="navigation-logo"
            style={{ height: "40px", width: "auto" }}
          />
        </Link>
      </div>
      <div className="navigation-right">
        {!isAuthenticated ? (
          <>
            <button onClick={handleLoginClick} className="nav-button">
              Login
            </button>
            <button onClick={handleSignupClick} className="nav-button">
              Sign Up
            </button>
          </>
        ) : (
          <Link to="/dashboard" className="nav-button">
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
