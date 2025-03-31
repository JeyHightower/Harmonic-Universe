import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, checkAuthState } from "../store/slices/authSlice";
import { fetchUniverses, createUniverse } from "../store/thunks/universeThunks";
import { Button } from "../components/common";
import { useModal } from "../contexts/ModalContext";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    error: authError,
  } = useSelector((state) => state.auth);
  const {
    universes,
    loading: universesLoading,
    error: universesError,
  } = useSelector((state) => state.universe);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const hasFetched = useRef(false);
  const authChecked = useRef(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    // Check auth state if not already checked
    if (!authChecked.current) {
      authChecked.current = true;
      dispatch(checkAuthState());
    }
  }, [dispatch]);

  useEffect(() => {
    // Only fetch if authenticated and haven't fetched yet
    if (isAuthenticated && !authLoading && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchUniverses());
    } else if (!isAuthenticated && !authLoading && !isNavigating.current) {
      isNavigating.current = true;
      navigate("/login", { replace: true });
    }
  }, [dispatch, isAuthenticated, authLoading, navigate]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      hasFetched.current = false; // Reset the fetch flag on logout
      authChecked.current = false; // Reset the auth check flag on logout
      isNavigating.current = false; // Reset the navigation flag on logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCreateUniverse = () => {
    openModal("universe-create", {
      onClose: () => {
        hasFetched.current = false; // Reset the fetch flag when creating a new universe
        dispatch(fetchUniverses());
      },
    });
  };

  const handleUniverseClick = (universeId) => {
    navigate(`/universe/${universeId}`);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="dashboard">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (authError) {
    return (
      <div className="dashboard">
        <div className="error">
          <p>Authentication error: {authError}</p>
          <Button onClick={handleLogout} variant="secondary">
            Logout
          </Button>
        </div>
      </div>
    );
  }

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
          {universesLoading ? (
            <div className="loading">Loading universes...</div>
          ) : universesError ? (
            <div className="error">
              Error loading universes: {universesError}
            </div>
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
