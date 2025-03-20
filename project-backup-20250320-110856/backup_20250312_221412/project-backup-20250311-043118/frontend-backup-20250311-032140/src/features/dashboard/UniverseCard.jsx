import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';

const UniverseCard = ({ universe, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/universes/${universe.id}`);
  };

  const handleNavigateToPhysics = e => {
    e.stopPropagation();
    navigate(`/universes/${universe.id}/physics`);
  };

  const handleNavigateToHarmony = e => {
    e.stopPropagation();
    navigate(`/universes/${universe.id}/harmony`);
  };

  const handleNavigateToVisual = e => {
    e.stopPropagation();
    navigate(`/universes/${universe.id}/visual`);
  };

  const handleNavigateToScenes = e => {
    e.stopPropagation();
    navigate(`/universes/${universe.id}/scenes`);
  };

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="universe-card">
      <div className="universe-card-content" onClick={handleClick}>
        <h3>{universe.name}</h3>
        <p>
          {universe.description || 'No description provided for this universe.'}
        </p>
      </div>
      <div className="universe-card-footer">
        <div className="universe-card-meta">
          <span>Created: {formatDate(universe.created_at)}</span>
          {universe.theme && (
            <span className="universe-theme">{universe.theme}</span>
          )}
          {universe.visibility && (
            <span className="universe-visibility">{universe.visibility}</span>
          )}
        </div>
        <div className="universe-card-actions">
          <Button
            onClick={e => {
              e.stopPropagation();
              navigate(`/universes/${universe.id}/storyboards`);
            }}
            variant="secondary"
            size="small"
          >
            Storyboards
          </Button>
          <Button
            onClick={handleNavigateToScenes}
            variant="secondary"
            size="small"
          >
            Scenes
          </Button>
          <Button
            onClick={e => {
              e.stopPropagation();
              onEdit(universe);
            }}
            variant="secondary"
            size="small"
          >
            Edit
          </Button>
          <Button
            onClick={e => {
              e.stopPropagation();
              onDelete(universe.id);
            }}
            variant="danger"
            size="small"
          >
            Delete
          </Button>
        </div>

        <div className="universe-params-buttons">
          <Button
            variant="tertiary"
            size="small"
            onClick={handleNavigateToPhysics}
            title="Physics Parameters"
          >
            Physics
          </Button>
          <Button
            variant="tertiary"
            size="small"
            onClick={handleNavigateToHarmony}
            title="Harmony Parameters"
          >
            Harmony
          </Button>
          <Button
            variant="tertiary"
            size="small"
            onClick={handleNavigateToVisual}
            title="Visualization Parameters"
          >
            Visual
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UniverseCard;
