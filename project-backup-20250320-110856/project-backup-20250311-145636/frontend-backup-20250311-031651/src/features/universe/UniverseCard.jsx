import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/dateUtils';
import './Universe.css';

const UniverseCard = ({ universe }) => {
    const defaultImage = '/images/default-universe.jpg';

    return (
        <Link to={`/universes/${universe.id}`} className="universe-card">
            <div className="universe-card-image">
                <img
                    src={universe.image_url || defaultImage}
                    alt={universe.name}
                    onError={(e) => { e.target.src = defaultImage; }}
                />
                <div className={`universe-visibility-badge ${universe.is_public ? 'public' : 'private'}`}>
                    {universe.is_public ? 'Public' : 'Private'}
                </div>
            </div>
            <div className="universe-card-content">
                <h2 className="universe-card-title">{universe.name}</h2>
                <p className="universe-card-description">
                    {universe.description ? (
                        universe.description.length > 100
                            ? `${universe.description.substring(0, 100)}...`
                            : universe.description
                    ) : (
                        'No description provided'
                    )}
                </p>
                <div className="universe-card-footer">
                    <span className="universe-card-scenes">
                        {universe.scene_count} {universe.scene_count === 1 ? 'Scene' : 'Scenes'}
                    </span>
                    <span className="universe-card-date">
                        {formatDate(universe.created_at)}
                    </span>
                </div>
            </div>
        </Link>
    );
};

UniverseCard.propTypes = {
    universe: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        image_url: PropTypes.string,
        is_public: PropTypes.bool,
        created_at: PropTypes.string,
        scene_count: PropTypes.number
    }).isRequired
};

export default UniverseCard;
