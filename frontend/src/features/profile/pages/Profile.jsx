import React from "react";
import { useSelector } from "react-redux";
import "../../../styles/Profile.css";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>
      <div className="profile-content">
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="info-group">
              <label>Username</label>
              <p>{user?.username}</p>
            </div>
            <div className="info-group">
              <label>Email</label>
              <p>{user?.email}</p>
            </div>
            <div className="info-group">
              <label>Member Since</label>
              <p>{new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="profile-section">
          <h2>Preferences</h2>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
        <div className="profile-section">
          <h2>Security</h2>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
