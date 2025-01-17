import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createUniverse } from '../../redux/slices/universeSlice';
import UniverseCard from './UniverseCard';
import UniverseForm from './UniverseForm';
import { CardTransition } from '../Common/Transitions';
import styles from './Universe.module.css';

const UniverseList = ({ universes }) => {
  const dispatch = useDispatch();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateUniverse = async (universeData) => {
    try {
      await dispatch(createUniverse(universeData)).unwrap();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create universe:', error);
    }
  };

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
        {universes.map(universe => (
          <CardTransition key={universe.id}>
            <UniverseCard universe={universe} />
          </CardTransition>
        ))}
      </div>
    </div>
  );
};

export default UniverseList;
