import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchScenes, deleteScene } from '../store/scenesThunks.js';
import { fetchUniverseById } from '../store/universeThunks.js';
import { clearSceneError } from '../store/scenesSlice.js';
import SceneCard from '../components/SceneCard.jsx';
import SceneFormModal from './SceneFormModal.jsx';
import Button from '../components/Button.jsx';
import Tooltip from '../components/Tooltip.jsx';
import '../styles/ScenesList.css';

const ScenesList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { universeId } = useParams();
    const { scenes, loading, error } = useSelector(state => state.scenes);
    const { currentUniverse, loading: universeLoading } = useSelector(state => state.universe);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sceneToEdit, setSceneToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('scene_order');

    // On component mount, fetch scenes and universe details
    useEffect(() => {
        if (universeId) {
            console.log('ScenesList - Fetching scenes for universe:', universeId);
            dispatch(fetchScenes(universeId));
            dispatch(fetchUniverseById({ id: universeId }));
        }

        return () => {
            dispatch(clearSceneError());
        };
    }, [dispatch, universeId]);

    // Filter and sort scenes based on search term and sort option
    const filteredAndSortedScenes = useCallback(() => {
        if (!scenes || !Array.isArray(scenes)) {
            console.warn('ScenesList - scenes is not an array:', scenes);
            return [];
        }

        // Filter by search term
        let filtered = scenes.filter(scene => {
            const titleMatch = scene.title && scene.title.toLowerCase().includes(searchTerm.toLowerCase());
            const descMatch = scene.description && scene.description.toLowerCase().includes(searchTerm.toLowerCase());
            return titleMatch || descMatch;
        });

        // Sort based on selected option
        return filtered.sort((a, b) => {
            switch (sortOption) {
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'created_at':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'scene_order':
                default:
                    return (a.scene_order || 0) - (b.scene_order || 0);
            }
        });
    }, [scenes, searchTerm, sortOption]);

    // Handle creating a new scene
    const handleCreateClick = () => {
        setSceneToEdit(null);
        setIsCreateModalOpen(true);
    };

    // Handle editing a scene
    const handleEditScene = (scene) => {
        setSceneToEdit(scene);
        setIsCreateModalOpen(true);
    };

    // Handle deleting a scene
    const handleDeleteScene = (sceneId) => {
        if (window.confirm('Are you sure you want to delete this scene? This action cannot be undone.')) {
            dispatch(deleteScene(sceneId))
                .then(() => {
                    console.log('ScenesList - Scene deleted successfully');
                })
                .catch(err => {
                    console.error('ScenesList - Failed to delete scene:', err);
                });
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setSceneToEdit(null);
    };

    // Handle successful scene creation/update
    const handleSceneSuccess = (scene) => {
        console.log('ScenesList - Scene saved successfully:', scene);
        setIsCreateModalOpen(false);
        setSceneToEdit(null);

        // Refresh scenes list
        dispatch(fetchScenes(universeId));
    };

    // Handle back navigation
    const handleBackClick = () => {
        navigate(`/universes/${universeId}`);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle sort option change
    const handleSortChange = (e) => {
        setSortOption(e.target.value);
    };

    const scenesToDisplay = filteredAndSortedScenes();

    return (
        <div className="scenes-list-container">
            <div className="scenes-list-header">
                <div className="header-left">
                    <Button
                        variant="text"
                        onClick={handleBackClick}
                        className="back-button"
                    >
                        <i className="fas fa-arrow-left"></i> Back to Universe
                    </Button>
                    <h1>{currentUniverse?.name ? `${currentUniverse.name}: Scenes` : 'Scenes'}</h1>
                </div>

                <div className="scenes-list-controls">
                    <div className="search-container">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search scenes..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>

                    <Tooltip content="Sort scenes by different criteria" position="bottom">
                        <select
                            className="sort-select"
                            value={sortOption}
                            onChange={handleSortChange}
                        >
                            <option value="scene_order">By Order</option>
                            <option value="title">By Title</option>
                            <option value="created_at">Most Recent</option>
                        </select>
                    </Tooltip>

                    <Tooltip content="Create a new scene" position="bottom">
                        <Button
                            variant="primary"
                            onClick={handleCreateClick}
                        >
                            <i className="fas fa-plus"></i> Create Scene
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {typeof error === 'string' ? error : error.message || 'An error occurred'}
                </div>
            )}

            {(loading || universeLoading) ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading scenes...</p>
                </div>
            ) : scenesToDisplay.length === 0 ? (
                <div className="empty-state">
                    {searchTerm ? (
                        <>
                            <i className="fas fa-search empty-icon"></i>
                            <h3>No matching scenes found</h3>
                            <p>Try adjusting your search or clear it to see all scenes.</p>
                            <Button variant="secondary" onClick={() => setSearchTerm('')}>
                                Clear Search
                            </Button>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-film empty-icon"></i>
                            <h3>No scenes yet</h3>
                            <p>Create your first scene to start building your universe's story.</p>
                            <Button variant="primary" onClick={handleCreateClick}>
                                Create First Scene
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="scenes-grid">
                    {scenesToDisplay.map(scene => (
                        <SceneCard
                            key={scene.id || `scene-${Math.random()}`}
                            scene={scene}
                            onEdit={handleEditScene}
                            onDelete={handleDeleteScene}
                        />
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <SceneFormModal
                    isOpen={isCreateModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleSceneSuccess}
                    initialData={sceneToEdit}
                    universeId={universeId}
                />
            )}
        </div>
    );
};

export default ScenesList;
