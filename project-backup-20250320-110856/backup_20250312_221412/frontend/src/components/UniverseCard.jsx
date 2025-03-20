import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Tooltip from './Tooltip';
import '../styles/UniverseCard.css';

const UniverseCard = ({ universe, isNew = false }) => {
    const navigate = useNavigate();

    // Format the date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate time since creation/update
    const getTimeSince = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    };

    // Get a placeholder image if none is provided
    const getImageUrl = () => {
        if (universe?.image_url) return universe.image_url;
        // Return a placeholder based on the universe name to add variety
        const hash = universe?.name ? universe.name.charCodeAt(0) % 5 : 0;
        return `https://picsum.photos/seed/universe${hash}/300/200`;
    };

    // Handle click to navigate to universe detail
    const handleCardClick = () => {
        if (universe?.id) {
            navigate(`/universes/${universe.id}`);
        }
    };

    return (
        <div className={`universe-card-wrapper ${isNew ? 'new-universe' : ''}`} onClick={handleCardClick}>
            <div className="universe-card-new">
                {isNew && (
                    <div className="new-badge">
                        <Tooltip content="Just created!" position="top">
                            <span>NEW</span>
                        </Tooltip>
                    </div>
                )}
                <div className="universe-card-image">
                    <img src={getImageUrl()} alt={universe?.name || 'Universe'} />
                    <div className="universe-card-badge">
                        <Tooltip
                            content={universe?.is_public ? 'Visible to everyone' : 'Only visible to you'}
                            position="top"
                        >
                            <span className={universe?.is_public ? 'public-badge' : 'private-badge'}>
                                {universe?.is_public ? 'Public' : 'Private'}
                            </span>
                        </Tooltip>
                    </div>
                </div>

                <div className="universe-card-content">
                    <h3 className="universe-card-title">{universe?.name || 'Unnamed Universe'}</h3>

                    <p className="universe-card-description">
                        {universe?.description || 'No description available'}
                    </p>

                    <div className="universe-card-details">
                        {universe?.theme && (
                            <Tooltip content="Universe theme" position="bottom">
                                <span className="universe-detail-item">
                                    <i className="fas fa-palette"></i> {universe.theme}
                                </span>
                            </Tooltip>
                        )}

                        {universe?.genre && (
                            <Tooltip content="Universe genre" position="bottom">
                                <span className="universe-detail-item">
                                    <i className="fas fa-theater-masks"></i> {universe.genre}
                                </span>
                            </Tooltip>
                        )}
                    </div>

                    <div className="universe-card-footer">
                        <Tooltip
                            content={`Created: ${formatDate(universe?.created_at)}`}
                            position="bottom"
                        >
                            <span className="universe-date">
                                <i className="far fa-calendar-plus"></i> {getTimeSince(universe?.created_at)}
                            </span>
                        </Tooltip>

                        {universe?.updated_at && universe?.updated_at !== universe?.created_at && (
                            <Tooltip
                                content={`Last updated: ${formatDate(universe?.updated_at)}`}
                                position="bottom"
                            >
                                <span className="universe-date">
                                    <i className="far fa-edit"></i> {getTimeSince(universe?.updated_at)}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

UniverseCard.propTypes = {
    universe: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        description: PropTypes.string,
        image_url: PropTypes.string,
        theme: PropTypes.string,
        genre: PropTypes.string,
        is_public: PropTypes.bool,
        created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired,
    isNew: PropTypes.bool
};

export default UniverseCard;
