// DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserUniverses } from '../redux/actions/universeActions';
import LoadingSpinner from '../components/LoadingSpinner';
import UniverseCard from '../components/UniverseCard';
import EmptyState from '../components/EmptyState';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { universes, loading, error } = useSelector(state => state.universe);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    dispatch(fetchUserUniverses());
  }, [dispatch]);

  const filteredUniverses = universes?.filter(universe =>
    universe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUniverse = () => {
    navigate('/universe/create');
  };

  const sortUniverses = (universes) => {
    return [...universes].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'harmony':
          return b.harmony - a.harmony;
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My Universes</h1>
          <button
            className="create-universe-btn"
            onClick={handleCreateUniverse}
          >
            Create New Universe
          </button>
        </div>

        <div className="dashboard-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search universes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sort-control">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Most Recent</option>
              <option value="name">Name</option>
              <option value="harmony">Harmony Level</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
        </div>
      ) : filteredUniverses?.length === 0 ? (
        <EmptyState
          message="You haven't created any universes yet"
          actionLabel="Create Your First Universe"
          onAction={handleCreateUniverse}
        />
      ) : (
        <div className="universes-grid">
          {sortUniverses(filteredUniverses).map(universe => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              onEdit={() => navigate(`/universe/edit/${universe.id}`)}
              onView={() => navigate(`/universe/${universe.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
