import React from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Logo } from "./Logo";
import { openModal } from "../../store/slices/modalSlice";
import "./Navigation.css";

function Navigation() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleLoginClick = () => {
    dispatch(openModal({ type: "LOGIN" }));
  };

  const handleRegisterClick = () => {
    dispatch(openModal({ type: "REGISTER" }));
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
