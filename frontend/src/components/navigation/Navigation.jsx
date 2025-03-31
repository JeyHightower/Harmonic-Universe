import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "./Logo";
import { useModal } from "../../contexts/ModalContext";
import { MODAL_TYPES } from "../../constants/modalTypes";
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
      <div className="navigation-brand">
        <Link to="/" className="navigation-logo">
          <Logo size={32} />
        </Link>
      </div>
      <div className="navigation-menu">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="navigation-link">
              Dashboard
            </Link>
            <Link to="/profile" className="navigation-link">
              Profile
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={handleLoginClick}
              className="navigation-button"
              type="button"
            >
              Login
            </button>
            <button
              onClick={handleSignupClick}
              className="navigation-button"
              type="button"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
