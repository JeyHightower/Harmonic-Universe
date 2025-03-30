import React from "react";
import { Link } from "react-router-dom";
import logoSvg from "../../assets/logo.svg";
import "../../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img
            src={logoSvg}
            alt="Harmonic Universe Logo"
            className="navbar-logo"
            style={{ height: "40px", width: "auto", marginRight: "10px" }}
          />
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
