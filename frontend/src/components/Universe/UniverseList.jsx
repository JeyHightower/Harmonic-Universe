import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createUniverse,
  fetchUniverses,
} from '../../store/slices/universeSlice';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import { CardTransition } from '../Common/Transitions';
import styles from './Universe.module.css';
import UniverseCard from './UniverseCard';
import UniverseForm from './UniverseForm';

const UniverseList = () => {
  const dispatch = useDispatch();
  const { universes, isLoading, error } = useSelector(state => state.universe);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleCreateUniverse = async universeData => {
    try {
      await dispatch(createUniverse(universeData)).unwrap();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

  const filteredUniverses = universes?.filter(universe =>
    universe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={styles.universeList}>
      <div className={styles.header}>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Create New Universe
        </button>
        <input
          type="text"
          placeholder="Search universes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          data-testid="universe-search"
        />
      </div>

      {showCreateForm && (
        <UniverseForm
          onSubmit={handleCreateUniverse}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className={styles.grid}>
        {filteredUniverses &&
          filteredUniverses.map(universe => (
            <CardTransition key={universe.id}>
              <UniverseCard universe={universe} />
            </CardTransition>
          ))}
        {filteredUniverses && filteredUniverses.length === 0 && (
          <p className={styles.noUniverses}>
            No universes found. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
};

export default UniverseList;
