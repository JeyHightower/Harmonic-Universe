import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  fetchUniverseById,
  updateUniverse,
} from '../../redux/slices/universeSlice';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import MusicControlPanel from '../Music/MusicControlPanel';
import PhysicsControlPanel from '../Physics/PhysicsControlPanel';
import StoryboardPanel from '../Storyboard/StoryboardPanel';
import './UniverseDetail.css';

const UniverseDetail = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const { currentUniverse, isLoading, error } = useSelector(
    state => state.universe
  );
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (universeId) {
      dispatch(fetchUniverseById(universeId));
    }
  }, [dispatch, universeId]);

  const handlePhysicsChange = parameters => {
    dispatch(
      updateUniverse({
        id: universeId,
        physics_parameters: parameters,
      })
    );
  };

  const handleMusicChange = parameters => {
    dispatch(
      updateUniverse({
        id: universeId,
        music_parameters: parameters,
      })
    );
  };

  const handleStoryboardChange = plotPoints => {
    dispatch(
      updateUniverse({
        id: universeId,
        storyboard: plotPoints,
      })
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentUniverse) return <ErrorMessage message="Universe not found" />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-section">
            <h2>{currentUniverse.title}</h2>
            <p className="description">{currentUniverse.description}</p>
            <div className="metadata">
              <div className="metadata-item">
                <label>Created:</label>
                <span>
                  {new Date(currentUniverse.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="metadata-item">
                <label>Last Updated:</label>
                <span>
                  {new Date(currentUniverse.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="metadata-item">
                <label>Visibility:</label>
                <span>{currentUniverse.is_public ? 'Public' : 'Private'}</span>
              </div>
            </div>
          </div>
        );

      case 'physics':
        return (
          <PhysicsControlPanel
            initialValues={currentUniverse.physics_parameters}
            onChange={handlePhysicsChange}
          />
        );

      case 'music':
        return (
          <MusicControlPanel
            initialValues={currentUniverse.music_parameters}
            onChange={handleMusicChange}
          />
        );

      case 'storyboard':
        return (
          <StoryboardPanel
            initialPoints={currentUniverse.storyboard || []}
            onChange={handleStoryboardChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="universe-detail">
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'physics' ? 'active' : ''}`}
          onClick={() => setActiveTab('physics')}
        >
          Physics
        </button>
        <button
          className={`tab ${activeTab === 'music' ? 'active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          Music
        </button>
        <button
          className={`tab ${activeTab === 'storyboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('storyboard')}
        >
          Storyboard
        </button>
      </nav>

      <div className="content">{renderTabContent()}</div>
    </div>
  );
};

export default UniverseDetail;
