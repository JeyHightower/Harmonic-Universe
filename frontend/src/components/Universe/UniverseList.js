import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createUniverse,
  fetchUniverses,
} from '../../redux/slices/universeSlice';
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={styles.universeList}>
      <button
        className={styles.createButton}
        onClick={() => setShowCreateForm(true)}
      >
        Create New Universe
      </button>

      {showCreateForm && (
        <UniverseForm
          onSubmit={handleCreateUniverse}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className={styles.grid}>
        {universes &&
          universes.map(universe => (
            <CardTransition key={universe.id}>
              <UniverseCard universe={universe} />
            </CardTransition>
          ))}
        {universes && universes.length === 0 && (
          <p className={styles.noUniverses}>
            No universes found. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
};

export default UniverseList;
