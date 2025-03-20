import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Harmonic Universe</Link>
            </div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/dashboard">Dashboard</Link>
            </div>
        </nav>
    );
};

export default Navbar;
