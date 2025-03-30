import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { openModal } from "../../store/slices/modalSlice";
import Button from "../common/Button";
import "../../styles/Navbar.css";

const Navigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    dispatch(openModal({ type: "LOGIN" }));
  };

  const handleRegister = () => {
    dispatch(openModal({ type: "REGISTER" }));
  };

  return (
    <nav className="navigation">
      <div className="navigation-brand">
        <Link to="/" className="navigation-logo">
          Harmonic Universe
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
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="navigation-button"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleLogin}
              className="navigation-button"
            >
              Login
            </Button>
            <Button
              variant="primary"
              onClick={handleRegister}
              className="navigation-button"
            >
              Register
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
