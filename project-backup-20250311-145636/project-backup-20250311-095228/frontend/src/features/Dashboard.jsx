import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_CONFIG } from '../utils/config.js';

const Dashboard = () => {
  const navigate = useNavigate();

  // Check for authentication on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      navigate('/?modal=login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);

    // Redirect to homepage
    navigate('/', { replace: true });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Harmonic Universe</h2>
          <p>Your dashboard is currently empty. Soon, you'll be able to create and manage your universes here.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Quick Start</h3>
            <p>Create your first universe and explore the connection between music and physics.</p>
            <button className="button button-primary">Create Universe</button>
          </div>

          <div className="dashboard-card">
            <h3>Tutorials</h3>
            <p>Learn how to use Harmonic Universe with our comprehensive tutorials.</p>
            <button className="button button-secondary">View Tutorials</button>
          </div>

          <div className="dashboard-card">
            <h3>Community</h3>
            <p>Connect with other users and share your creations.</p>
            <button className="button button-tertiary">Join Community</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
