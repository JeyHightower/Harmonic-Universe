import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "./Logo";
import { useModal } from "../../contexts/ModalContext";
import { MODAL_TYPES } from "../../constants/modalTypes";
import "./Navigation.css";

function Navigation() {
  const { openModal } = useModal();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleLoginClick = () => {
    openModal(MODAL_TYPES.LOGIN);
  };

  const handleRegisterClick = () => {
    openModal(MODAL_TYPES.REGISTER);
  };

  return (
    <nav className="navigation">
      <div className="navigation-left">
        <Link to="/" className="logo-link">
          <Logo size={32} />
        </Link>
      </div>
      <div className="navigation-right">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </>
        ) : (
          <>
            <button onClick={handleLoginClick} className="nav-button">
              Login
            </button>
            <button onClick={handleRegisterClick} className="nav-button">
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
