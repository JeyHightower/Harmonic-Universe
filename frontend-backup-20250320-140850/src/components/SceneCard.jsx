import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SceneCard.css';
import Tooltip from './Tooltip';

const SceneCard = ({ scene, onEdit, onDelete }) => {
    const navigate = useNavigate();

    // Format the date
    const formatDate = (dateValue) => {
        if (!dateValue) return 'Unknown date';
        const date = new Date(dateValue);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate time since creation/update
    const getTimeSince = (dateValue) => {
        if (!dateValue) return '';

        const date = new Date(dateValue);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    };

    // Get scene type display name
    const getSceneTypeDisplay = (type) => {
        const typeMap = {
            'standard': 'Standard',
            'cinematic': 'Cinematic',
            'action': 'Action',
            'dialogue': 'Dialogue',
            'montage': 'Montage'
        };
        return typeMap[type] || type;
    };

    // Handle click to navigate to scene detail
    const handleClick = (e) => {
        if (e.target.closest('.scene-action-btn')) {
            // Don't navigate if clicking on an action button
            return;
        }
        navigate(`/scenes/${scene.id}`);
    };

    // Handle edit button click
    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit && onEdit(scene);
    };

    // Handle delete button click
    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete && onDelete(scene.id);
    };

    return (
        <div className="scene-card" onClick={handleClick}>
            <div className="scene-card-content">
                <h3 className="scene-card-title">{scene.title || 'Untitled Scene'}</h3>
                <div className="scene-type-badge">
                    <Tooltip content="Scene type" position="top">
                        <span>{getSceneTypeDisplay(scene.scene_type || 'standard')}</span>
                    </Tooltip>
                </div>
                <p className="scene-card-description">
                    {scene.description || 'No description available'}
                </p>

                <div className="scene-card-details">
                    {scene.duration && (
                        <Tooltip content="Scene duration" position="bottom">
                            <span className="scene-detail-item">
                                <i className="fas fa-clock"></i> {scene.duration}s
                            </span>
                        </Tooltip>
                    )}

                    <Tooltip content={scene.is_active ? 'Active scene' : 'Inactive scene'} position="bottom">
                        <span className={`scene-status ${scene.is_active ? 'active' : 'inactive'}`}>
                            <i className={`fas fa-${scene.is_active ? 'check-circle' : 'times-circle'}`}></i>
                            {scene.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </Tooltip>
                </div>

                <div className="scene-card-footer">
                    <Tooltip content={`Created: ${formatDate(scene.created_at)}`} position="bottom">
                        <span className="scene-date">
                            <i className="far fa-calendar-plus"></i> {getTimeSince(scene.created_at)}
                        </span>
                    </Tooltip>

                    {scene.updated_at && scene.updated_at !== scene.created_at && (
                        <Tooltip content={`Last updated: ${formatDate(scene.updated_at)}`} position="bottom">
                            <span className="scene-date">
                                <i className="far fa-edit"></i> {getTimeSince(scene.updated_at)}
                            </span>
                        </Tooltip>
                    )}
                </div>
            </div>

            <div className="scene-card-actions">
                <Tooltip content="Edit this scene" position="left">
                    <button className="scene-action-btn edit-btn" onClick={handleEdit}>
                        <i className="fas fa-edit"></i>
                    </button>
                </Tooltip>
                <Tooltip content="Delete this scene" position="left">
                    <button className="scene-action-btn delete-btn" onClick={handleDelete}>
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

SceneCard.propTypes = {
    scene: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        description: PropTypes.string,
        scene_type: PropTypes.string,
        is_active: PropTypes.bool,
        duration: PropTypes.number,
        created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
};

export default SceneCard;
