import React from "react";
import { useSelector } from "react-redux";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.username}!</h1>
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Your Universes</h2>
          <p>Create and manage your musical universes</p>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
        <div className="dashboard-section">
          <h2>Sound Profiles</h2>
          <p>Design and save your sound profiles</p>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
        <div className="dashboard-section">
          <h2>Music Pieces</h2>
          <p>Compose and organize your music</p>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
        <div className="dashboard-section">
          <h2>Notes</h2>
          <p>Keep track of your ideas and inspirations</p>
          <div className="placeholder-content">
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
