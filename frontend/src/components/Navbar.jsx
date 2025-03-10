import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <header style={{
            borderBottom: '1px solid #eaeaea',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div className="logo">
                <Link to="/" style={{ textDecoration: 'none', color: '#1890ff', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    Harmonic Universe
                </Link>
            </div>

            <nav>
                <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
                    <li><Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link></li>
                    <li><Link to="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link></li>
                    <li><Link to="/profile" style={{ textDecoration: 'none', color: '#333' }}>Profile</Link></li>
                    <li><Link to="/login" style={{ textDecoration: 'none', color: '#333' }}>Login</Link></li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;
