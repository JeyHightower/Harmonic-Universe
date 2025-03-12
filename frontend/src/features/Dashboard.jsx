import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUniverses } from '../store/universeThunks.js';
import { AUTH_CONFIG } from '../utils/config.js';
import UniverseFormModal from './UniverseFormModal.jsx';
import UniverseCard from '../components/UniverseCard.jsx';
import Tooltip from '../components/Tooltip.jsx';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universe);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState('updated_at');
  const [filterOption, setFilterOption] = useState('all');
  const [newUniverseId, setNewUniverseId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced function to load universes with better error handling and logging
  const loadUniverses = useCallback(() => {
    console.log('Dashboard - Loading universes, attempt:', retryCount + 1);
    return dispatch(fetchUniverses({ includePublic: true }))
      .then(result => {
        console.log('Dashboard - Fetch universes result:', result);
        if (!result.payload || !Array.isArray(result.payload.universes)) {
          console.warn('Dashboard - Invalid response format:', result);
          if (retryCount < 3) {
            console.log('Dashboard - Retrying fetch...');
            setRetryCount(prev => prev + 1);
          }
        } else {
          console.log('Dashboard - Successfully loaded universes:', result.payload.universes.length);
        }
        return result;
      })
      .catch(err => {
        console.error('Dashboard - Failed to load universes:', err);
        if (retryCount < 3) {
          console.log('Dashboard - Retrying fetch...');
          setRetryCount(prev => prev + 1);
        }
      });
  }, [dispatch, retryCount]);

  // Debug log to check universes data - enhanced with more detail
  useEffect(() => {
    if (universes) {
      console.log('Dashboard - Current universes state:', {
        count: Array.isArray(universes) ? universes.length : 'not an array',
        data: universes
      });
    } else {
      console.log('Dashboard - Universes state is null or undefined');
    }
  }, [universes]);

  // Check for authentication and load data on component mount or retry
  useEffect(() => {
    const accessToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      navigate('/?modal=login', { replace: true });
    } else {
      // Fetch universes when component mounts or retry is triggered
      console.log('Dashboard - Fetching universes...');
      loadUniverses();
    }
  }, [navigate, loadUniverses, retryCount]);

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);

    // Redirect to homepage
    navigate('/', { replace: true });
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (universe) => {
    console.log('Dashboard - Create success with universe:', universe);
    setIsCreateModalOpen(false);

    // Set the new universe ID to highlight it
    if (universe && universe.id) {
      setNewUniverseId(universe.id);
      console.log('Dashboard - Set new universe ID:', universe.id);
    }

    // Don't navigate away immediately - first refresh the universes list
    // and ensure the dashboard shows the new universe
    if (universe && universe.id) {
      // Update the list first and show the dashboard with the new universe
      console.log('Dashboard - Refreshing universe list...');
      loadUniverses()
        .then(() => {
          console.log('Dashboard - Universe list refreshed, showing dashboard with new universe');

          // Add a significantly longer delay to ensure the user sees the new universe
          // on the dashboard before navigating away
          setTimeout(() => {
            console.log('Dashboard - Now navigating to universe:', universe.id);
            setNewUniverseId(null); // Clear the new universe ID before navigating
            navigate(`/universes/${universe.id}`);
          }, 2500); // Increased to 2.5 seconds for better visibility
        })
        .catch(err => {
          console.error('Dashboard - Error refreshing universe list:', err);
        });
    } else {
      console.warn('Dashboard - Cannot navigate: universe or universe.id is undefined', universe);
      // Still refresh the list even if we can't navigate
      loadUniverses();
    }
  };

  // Sort universes based on selected option - with improved error handling
  const getSortedUniverses = () => {
    // Enhanced validation of universes data
    if (!universes) {
      console.warn('Dashboard - getSortedUniverses: universes is null or undefined');
      return [];
    }

    if (!Array.isArray(universes)) {
      console.warn('Dashboard - getSortedUniverses: universes is not an array', universes);
      return [];
    }

    console.log('Dashboard - Sorting universes, count:', universes.length);
    let filteredUniverses = [...universes];

    // Apply filter
    if (filterOption === 'public') {
      filteredUniverses = filteredUniverses.filter(u => u.is_public);
    } else if (filterOption === 'private') {
      filteredUniverses = filteredUniverses.filter(u => !u.is_public);
    }

    // Apply sort
    return filteredUniverses.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'created_at':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'updated_at':
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });
  };

  // Manually retrigger universe loading
  const handleRefresh = () => {
    console.log('Dashboard - Manual refresh triggered');
    loadUniverses();
  };

  // For rendering - now with universe count for debugging
  const sortedUniverses = getSortedUniverses();
  const universeCount = Array.isArray(sortedUniverses) ? sortedUniverses.length : 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title-area">
          <h1>Dashboard</h1>
          <Tooltip content="View and manage your universes" position="bottom">
            <span className="header-subtitle">Your Harmonic Universe Hub</span>
          </Tooltip>
        </div>
        <div className="dashboard-header-actions">
          <Tooltip content="Refresh universe list" position="bottom">
            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </Tooltip>
          <Tooltip content="Log out of your account" position="bottom">
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading universes...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>Error loading universes: {typeof error === 'string' ? error : JSON.stringify(error)}</p>
            <button className="button button-primary" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        ) : universes && Array.isArray(universes) && universes.length > 0 ? (
          <div className="universes-container">
            <div className="universes-header">
              <h2>My Universes ({universeCount})</h2>
              <div className="universes-controls">
                <div className="filter-sort-controls">
                  <Tooltip content="Filter universes by visibility" position="top">
                    <select
                      className="control-select"
                      value={filterOption}
                      onChange={(e) => setFilterOption(e.target.value)}
                    >
                      <option value="all">All Universes</option>
                      <option value="public">Public Only</option>
                      <option value="private">Private Only</option>
                    </select>
                  </Tooltip>

                  <Tooltip content="Sort universes by different criteria" position="top">
                    <select
                      className="control-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="updated_at">Recently Updated</option>
                      <option value="created_at">Recently Created</option>
                      <option value="name">Name (A-Z)</option>
                    </select>
                  </Tooltip>
                </div>

                <Tooltip content="Create a new universe" position="left">
                  <button className="button button-primary" onClick={handleCreateClick}>
                    Create New Universe
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="universe-grid">
              {sortedUniverses.map((universe) => (
                <UniverseCard
                  key={universe?.id || `universe-${Math.random()}`}
                  universe={universe}
                  isNew={universe?.id === newUniverseId}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="welcome-card">
            <h2>Welcome to Harmonic Universe</h2>
            <p>Your dashboard is currently empty. Create your first universe to get started!</p>
            <Tooltip content="Create your first universe" position="bottom">
              <button className="button button-primary" onClick={handleCreateClick}>
                Create Universe
              </button>
            </Tooltip>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Quick Start</h3>
            <p>Create your first universe and explore the connection between music and physics.</p>
            <Tooltip content="Begin your cosmic journey" position="top">
              <button className="button button-primary" onClick={handleCreateClick}>
                Create Universe
              </button>
            </Tooltip>
          </div>

          <div className="dashboard-card">
            <h3>Tutorials</h3>
            <p>Learn how to use Harmonic Universe with our comprehensive tutorials.</p>
            <Tooltip content="Learn how to use the platform" position="top">
              <button className="button button-secondary">View Tutorials</button>
            </Tooltip>
          </div>

          <div className="dashboard-card">
            <h3>Community</h3>
            <p>Connect with other users and share your creations.</p>
            <Tooltip content="Connect with other creators" position="top">
              <button className="button button-tertiary">Join Community</button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Create Universe Modal */}
      {isCreateModalOpen && (
        <UniverseFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
