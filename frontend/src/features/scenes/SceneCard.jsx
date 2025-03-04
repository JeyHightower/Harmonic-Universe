import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import './SceneCard.css';

const SceneCard = ({ scene, onEdit, onDelete }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/universes/${scene.universe_id}/scenes/${scene.id}`);
    };

    const formatDate = dateString => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="scene-card">
            <div className="scene-card-content" onClick={handleClick}>
                <h3>{scene.name}</h3>
                <p>
                    {scene.description || 'No description provided for this scene.'}
                </p>
            </div>
            <div className="scene-card-footer">
                <div className="scene-card-meta">
                    <span>Created: {formatDate(scene.created_at)}</span>
                    <span className="scene-order">Order: {scene.scene_order || 1}</span>
                    {scene.type && (
                        <span className="scene-type">{scene.type}</span>
                    )}
                </div>
                <div className="scene-card-actions">
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            navigate(`/universes/${scene.universe_id}/scenes/${scene.id}/physics`);
                        }}
                        variant="secondary"
                        size="small"
                    >
                        Physics
                    </Button>
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            onEdit(scene);
                        }}
                        variant="secondary"
                        size="small"
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            onDelete(scene.id);
                        }}
                        variant="danger"
                        size="small"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SceneCard;
