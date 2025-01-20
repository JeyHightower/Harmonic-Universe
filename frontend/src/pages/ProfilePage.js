import React from 'react';
import { useSelector } from 'react-redux';
import './ProfilePage.css';

const ProfilePage = () => {
  const user = useSelector(state => state.auth.user);

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Your Profile</h1>
        <p>Manage your account and preferences</p>
      </header>

      <div className="profile-content">
        <section className="profile-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            <div className="info-item">
              <label>Member Since</label>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h2>Your Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Universes Created</h3>
              <p className="stat-number">{user.universe_count || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Favorites</h3>
              <p className="stat-number">{user.favorite_count || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Collaborations</h3>
              <p className="stat-number">{user.collaboration_count || 0}</p>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h2>Preferences</h2>
          <div className="preferences-list">
            <div className="preference-item">
              <label>
                <input
                  type="checkbox"
                  checked={user.email_notifications}
                  readOnly
                />
                Email Notifications
              </label>
            </div>
            <div className="preference-item">
              <label>
                <input type="checkbox" checked={user.public_profile} readOnly />
                Public Profile
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
