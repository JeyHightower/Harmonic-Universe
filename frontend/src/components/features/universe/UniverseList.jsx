import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUniverses } from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import './Universe.css';

const UniverseList = () => {
  const dispatch = useDispatch();
  const { universes, loading, error } = useSelector(state => state.universe);

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="universe-list-container">
        <div className="universe-loading">
          <Spinner size="large" />
          <p>Loading universes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="universe-list-container">
        <div className="universe-error">
          <p>{error}</p>
          <Button onClick={() => dispatch(fetchUniverses())}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!universes || universes.length === 0) {
    return (
      <div className="universe-list-container">
        <div className="universe-empty">
          <h2>No Universes Created Yet</h2>
          <p>Create your first universe to get started!</p>
          <Link to="/universes/new">
            <Button variant="primary">Create Universe</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="universe-list-container">
      <div className="universe-list-header">
        <h2>Your Universes</h2>
        <Link to="/universes/new">
          <Button variant="primary">Create Universe</Button>
        </Link>
      </div>
      <div className="universe-grid">
        {universes.map(universe => (
          <Link
            key={universe.id}
            to={`/universes/${universe.id}`}
            className="universe-card"
          >
            <h3>{universe.name}</h3>
            <p>{universe.description}</p>
            <div className="universe-card-footer">
              <span>
                Created: {new Date(universe.created_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UniverseList;
