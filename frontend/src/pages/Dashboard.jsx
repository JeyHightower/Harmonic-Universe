import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import { fetchUniverses, createUniverse } from "../store/thunks/universeThunks";
import { Button } from "../components/common";
import { useModal } from "../contexts/ModalContext";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { universes, loading, error } = useSelector((state) => state.universe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModal();

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCreateUniverse = () => {
    openModal("universe-create", {
      onClose: () => {
        dispatch(fetchUniverses());
      },
    });
  };

  const handleUniverseClick = (universeId) => {
    navigate(`/universe/${universeId}`);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}!</h1>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Universes</h2>
            <Button onClick={handleCreateUniverse} variant="primary">
              Create Universe
            </Button>
          </div>
          {loading ? (
            <div className="loading">Loading universes...</div>
          ) : error ? (
            <div className="error">Error loading universes: {error}</div>
          ) : universes.length === 0 ? (
            <div className="empty-state">
              <p>No universes created yet</p>
              <Button onClick={handleCreateUniverse} variant="primary">
                Create Your First Universe
              </Button>
            </div>
          ) : (
            <div className="universes-grid">
              {universes.map((universe) => (
                <div
                  key={universe.id}
                  className="universe-card"
                  onClick={() => handleUniverseClick(universe.id)}
                >
                  <h3>{universe.name}</h3>
                  <p>{universe.description || "No description"}</p>
                  <div className="universe-meta">
                    <span>
                      Created:{" "}
                      {new Date(universe.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      Updated:{" "}
                      {new Date(universe.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
