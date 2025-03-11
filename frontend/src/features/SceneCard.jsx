import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import './SceneCard.css';

const SceneCard = ({ scene }) => {
    const defaultImage = '/images/default-scene.jpg';

    return (
        <Link to={`/scenes/${scene.id}`} className="scene-card">
            <div className="scene-card-image">
                <img
                    src={scene.image_url || defaultImage}
                    alt={scene.title}
                    onError={(e) => { e.target.src = defaultImage; }}
                />
                {scene.scene_type && (
                    <div className="scene-type-badge">{scene.scene_type}</div>
                )}
            </div>
            <div className="scene-card-content">
                <h3 className="scene-card-title">{scene.title}</h3>
                <p className="scene-card-description">
                    {scene.description ? (
                        scene.description.length > 80
                            ? `${scene.description.substring(0, 80)}...`
                            : scene.description
                    ) : (
                        'No description provided'
                    )}
                </p>
                <div className="scene-card-footer">
                    <span className="scene-card-order">
                        Order: {scene.order}
                    </span>
                    <span className="scene-card-date">
                        {formatDate(scene.created_at)}
                    </span>
                </div>
            </div>
        </Link>
    );
};

SceneCard.propTypes = {
    scene: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        image_url: PropTypes.string,
        scene_type: PropTypes.string,
        order: PropTypes.number,
        created_at: PropTypes.string
    }).isRequired
};

export default SceneCard;
