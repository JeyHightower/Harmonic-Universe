import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import { UniverseDeleteModal, UniverseModal } from '../index.mjs';
import '../styles/UniverseList.css';
import UniverseCard from './UniverseCard';

const UniverseList = () => {
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector((state) => state.universes);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [universeToDelete, setUniverseToDelete] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'public', 'private'
  const [sortBy, setSortBy] = useState('updated_at'); // 'name', 'created_at', 'updated_at'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    // Fetch universes only once when component mounts
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (newUniverse) => {
    console.log('Universe created successfully:', newUniverse);
    // Add a small delay before closing the modal to ensure Redux state is updated first
    setTimeout(() => {
      setIsCreateModalOpen(false);
    }, 50);
    // No need to refetch - Redux state is already updated
  };

  const handleDeleteClick = (universe) => {
    setUniverseToDelete(universe);
  };

  const handleDeleteSuccess = (deletedId) => {
    console.log('Universe deleted successfully:', deletedId);
    // Add a small delay before clearing state to ensure Redux update is processed
    setTimeout(() => {
      setUniverseToDelete(null);
    }, 50);
    // No need to refetch - Redux state is already updated
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort universes
  const filteredAndSortedUniverses = [...universes]
    .filter((universe) => {
      if (filter === 'all') return true;
      if (filter === 'public') return universe.is_public;
      if (filter === 'private') return !universe.is_public;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'updated_at':
          comparison =
            new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
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

          <div className="sort-controls">
            <select value={sortBy} onChange={handleSortChange} className="sort-select">
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
            </select>
            <Button
              variant="icon"
              size="small"
              onClick={handleSortOrderToggle}
              className="sort-order-button"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
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
      ) : filteredAndSortedUniverses.length > 0 ? (
        <div className="universe-grid">
          {filteredAndSortedUniverses.map((universe) => (
            <div key={universe.id} className="universe-card-wrapper">
              <UniverseCard universe={universe} />
              <div className="universe-card-actions">
                <Link to={`/universes/${universe.id}`} className="view-button">
                  View
                </Link>
                <Link to={`/universes/${universe.id}/edit`} className="edit-button">
                  Edit
                </Link>
                <button className="delete-button" onClick={() => handleDeleteClick(universe)}>
                  Delete
                </button>
              </div>
            </div>
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
        <UniverseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          isEdit={false}
        />
      )}

      {universeToDelete && (
        <UniverseDeleteModal
          isOpen={!!universeToDelete}
          onClose={() => setUniverseToDelete(null)}
          onSuccess={handleDeleteSuccess}
          universe={universeToDelete}
        />
      )}
    </div>
  );
};

export default UniverseList;
