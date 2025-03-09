import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUniverses } from '../../store/thunks/universeThunks';
import Button from '../../components/common/Button';
import UniverseCard from './UniverseCard';
import UniverseFormModal from './UniverseFormModal';
import './Universe.css';

function UniverseList() {
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universe);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'public', 'private'

  useEffect(() => {
    // Fetch universes when component mounts
    dispatch(fetchUniverses({ includePublic: true }));
  }, [dispatch]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    // Refresh the list after creating a new universe
    dispatch(fetchUniverses({ includePublic: true }));
  };

  const filteredUniverses = universes.filter(universe => {
    if (filter === 'all') return true;
    if (filter === 'public') return universe.is_public;
    if (filter === 'private') return !universe.is_public;
    return true;
  });

  return (
    <div className="universe-list-container">
      <div className="universe-list-header">
        <h1>My Universes</h1>
        <div className="universe-list-actions">
          <div className="filter-buttons">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'public' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter('public')}
            >
              Public
            </Button>
            <Button
              variant={filter === 'private' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter('private')}
            >
              Private
            </Button>
          </div>
          <Button onClick={handleCreateClick} variant="primary">
            Create Universe
          </Button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading universes...</p>
        </div>
      ) : filteredUniverses.length > 0 ? (
        <div className="universe-grid">
          {filteredUniverses.map((universe) => (
            <UniverseCard key={universe.id} universe={universe} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No universes found</h2>
          <p>Create your first universe to get started!</p>
          <Button onClick={handleCreateClick} variant="primary">
            Create Universe
          </Button>
        </div>
      )}

      {isCreateModalOpen && (
        <UniverseFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

export default UniverseList;
