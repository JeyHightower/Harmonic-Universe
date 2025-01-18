import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome to Your Universe</h1>
        <p>Create, explore, and shape your musical universe</p>
      </header>

      <div className="dashboard-grid">
        <Link to="/universe/create" className="dashboard-card">
          <div className="card-icon">🌟</div>
          <h3>Create Universe</h3>
          <p>Start a new musical journey</p>
        </Link>

        <Link to="/profile" className="dashboard-card">
          <div className="card-icon">👤</div>
          <h3>Your Profile</h3>
          <p>View and edit your profile</p>
        </Link>

        <Link to="/audio" className="dashboard-card">
          <div className="card-icon">🎵</div>
          <h3>Audio Controls</h3>
          <p>Manage your audio settings</p>
        </Link>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>Statistics</h3>
          <p>View your creation stats</p>
        </div>
      </div>

      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <p className="empty-state">No recent activity to show</p>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
