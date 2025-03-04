import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import UniverseFormModal from '../../../features/universe/UniverseFormModal';
import { checkAuthState, logout } from '../../../store/slices/authSlice';
import {
  resetState,
  setSortBy,
  setSortOrder,
  sortUniverses,
} from '../../../store/slices/universeSlice';
import {
  deleteUniverse,
  fetchUniverses,
} from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import './Dashboard.css';
import UniverseCard from './UniverseCard';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModalByType } = useModal();
  const {
    universes,
    loading: universesLoading,
    error,
    authError,
    sortBy,
    sortOrder,
  } = useSelector(state => state.universe);
  const { isAuthenticated, loading: authLoading } = useSelector(
    state => state.auth
  );

  // State for direct modal rendering
  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [universeToEdit, setUniverseToEdit] = useState(null);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  // Fetch initial data
  useEffect(() => {
    console.debug('Checking auth state...');
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle authentication and data fetching
  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          await dispatch(fetchUniverses({ signal: controller.signal }));
        } catch (error) {
          console.error('Error fetching universes:', error);
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            dispatch(logout());
            dispatch(resetState());
            navigate('/login');
          }
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, authLoading, dispatch, navigate]); // Only depend on auth state

  // Reset retry count when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      setRetryCount(0);
    }
  }, [isAuthenticated]);

  const handleCreateClick = useCallback(() => {
    console.log('Create Universe button clicked');
    setSelectedUniverse(null);
    setShowUniverseModal(true);
  }, []);

  const handleEditClick = universe => {
    console.log('Edit Universe button clicked', universe);
    // Set the universe to edit and open the modal
    setUniverseToEdit(universe);
    setShowUniverseModal(true);
  };

  const handleModalClose = useCallback(() => {
    console.log('Closing universe modal');
    setShowUniverseModal(false);
    setSelectedUniverse(null);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle sorting
  const handleSort = useCallback(
    newSortBy => {
      if (sortBy === newSortBy) {
        // Toggle sort order if clicking the same column
        dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
      } else {
        // Set new sort column and default to ascending order
        dispatch(setSortBy(newSortBy));
        dispatch(setSortOrder('asc'));
      }
      dispatch(sortUniverses());
    },
    [dispatch, sortBy, sortOrder]
  );

  const handleDeleteClick = universeId => {
    console.log('Delete Universe button clicked', universeId);
    if (window.confirm('Are you sure you want to delete this universe?')) {
      dispatch(deleteUniverse(universeId))
        .unwrap()
        .then(() => {
          // Refresh the list after deletion
          dispatch(fetchUniverses());
        })
        .catch(err => {
          console.error('Failed to delete universe:', err);
          console.error('Failed to delete universe. Please try again.');
        });
    }
  };

  // Filter universes based on search term
  const filteredUniverses = universes.filter(universe =>
    universe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render loading state
  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="large" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Render authentication error
  if (authError) {
    return (
      <div className="dashboard-error">
        <h2>Authentication Error</h2>
        <p>{authError}</p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  // Render not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="dashboard-not-authenticated">
        <h2>Please Log In</h2>
        <p>You need to be logged in to view your dashboard.</p>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Universes</h1>
        <div className="dashboard-actions">
          <Button onClick={handleCreateClick} variant="primary">
            Create Universe
          </Button>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search universes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-options">
          <span>Sort by:</span>
          <button
            className={sortBy === 'name' ? 'active' : ''}
            onClick={() => handleSort('name')}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={sortBy === 'created_at' ? 'active' : ''}
            onClick={() => handleSort('created_at')}
          >
            Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {universesLoading ? (
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading universes...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <Button onClick={handleRetry} variant="primary">
            Retry
          </Button>
        </div>
      ) : filteredUniverses.length === 0 ? (
        <div className="empty-state">
          <h2>No universes found</h2>
          <p>
            {searchTerm
              ? `No universes match "${searchTerm}"`
              : "You haven't created any universes yet"}
          </p>
          <Button onClick={handleCreateClick} variant="primary">
            Create Your First Universe
          </Button>
        </div>
      ) : (
        <div className="universe-grid">
          {filteredUniverses.map(universe => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Render the UniverseFormModal directly when showUniverseModal is true */}
      {showUniverseModal && (
        <UniverseFormModal
          onClose={handleModalClose}
          isGlobalModal={false}
          initialData={selectedUniverse}
        />
      )}
    </div>
  );
}

export default Dashboard;
