import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchSceneById, deleteScene } from '../../store/thunks/scenesThunks';
import { fetchUniverseById } from '../../store/thunks/universeThunks';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import SceneFormModal from './SceneFormModal';
import './SceneDetail.css';

const SceneDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentScene, loading: sceneLoading, error: sceneError } = useSelector(state => state.scenes);
    const { currentUniverse, loading: universeLoading } = useSelector(state => state.universe);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch scene data when component mounts
    useEffect(() => {
        if (id) {
            dispatch(fetchSceneById(id));
        }
    }, [dispatch, id]);

    // Fetch universe data when we have the scene
    useEffect(() => {
        if (currentScene && currentScene.universe_id) {
            dispatch(fetchUniverseById({ id: currentScene.universe_id }));
        }
    }, [dispatch, currentScene]);

    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await dispatch(deleteScene(id)).unwrap();
            // Navigate back to universe detail page after successful deletion
            if (currentScene && currentScene.universe_id) {
                navigate(`/universes/${currentScene.universe_id}`);
            } else {
                navigate('/universes');
            }
        } catch (err) {
            console.error('Failed to delete scene:', err);
            // Keep the modal open if there's an error
        }
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        // Refresh scene data
        dispatch(fetchSceneById(id));
    };

    // Show loading state when fetching scene
    if (sceneLoading && !currentScene) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading scene...</p>
            </div>
        );
    }

    // Show error state if scene fails to load
    if (sceneError) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{sceneError}</p>
                <Button onClick={() => navigate('/universes')}>
                    Back to Universes
                </Button>
            </div>
        );
    }

    // Show not found state if scene doesn't exist
    if (!currentScene) {
        return (
            <div className="not-found-container">
                <h2>Scene Not Found</h2>
                <p>The scene you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => navigate('/universes')}>
                    Back to Universes
                </Button>
            </div>
        );
    }

    return (
        <div className="scene-detail-container">
            <div className="scene-detail-header">
                <div className="scene-breadcrumb">
                    <Link to="/universes">Universes</Link>
                    {currentUniverse && (
                        <>
                            <span className="breadcrumb-separator">/</span>
                            <Link to={`/universes/${currentUniverse.id}`}>{currentUniverse.name}</Link>
                        </>
                    )}
                    <span className="breadcrumb-separator">/</span>
                    <span className="current-page">{currentScene.title}</span>
                </div>

                <div className="scene-actions">
                    <Button
                        onClick={handleEditClick}
                        variant="secondary"
                    >
                        Edit Scene
                    </Button>
                    <Button
                        onClick={handleDeleteClick}
                        variant="danger"
                    >
                        Delete Scene
                    </Button>
                </div>
            </div>

            <div className="scene-detail-content">
                <div className="scene-main">
                    <h1>{currentScene.title}</h1>

                    <div className="scene-meta">
                        {currentScene.scene_type && (
                            <span className="scene-type">{currentScene.scene_type}</span>
                        )}
                        <span className="scene-order">Order: {currentScene.order}</span>
                        <span className={`scene-status ${currentScene.is_active ? 'active' : 'inactive'}`}>
                            {currentScene.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {currentScene.image_url && (
                        <div className="scene-image">
                            <img
                                src={currentScene.image_url}
                                alt={currentScene.title}
                                onError={(e) => { e.target.src = '/images/default-scene.jpg'; }}
                            />
                        </div>
                    )}

                    <div className="scene-description">
                        <h2>Description</h2>
                        <p>{currentScene.description || 'No description provided'}</p>
                    </div>

                    <div className="scene-parameters-section">
                        <h2>Scene Parameters</h2>
                        <div className="parameters-grid">
                            <div className="parameter-card">
                                <h3>Physics Parameters</h3>
                                <p>Configure physical properties for this scene</p>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(`/scenes/${id}/physics`)}
                                >
                                    Manage Physics
                                </Button>
                            </div>
                            <div className="parameter-card">
                                <h3>Harmony Parameters</h3>
                                <p>Configure musical harmony settings for this scene</p>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(`/scenes/${id}/harmony`)}
                                >
                                    Manage Harmony
                                </Button>
                            </div>
                            <div className="parameter-card">
                                <h3>Visualization Settings</h3>
                                <p>Configure visual appearance settings for this scene</p>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(`/scenes/${id}/visualization`)}
                                >
                                    Manage Visuals
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <SceneFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                    initialData={currentScene}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Scene"
            >
                <div className="delete-confirmation">
                    <p>
                        Are you sure you want to delete the scene "{currentScene.title}"?
                        This action cannot be undone and will delete all data associated with this scene.
                    </p>
                    <div className="modal-actions">
                        <Button
                            onClick={() => setIsDeleteModalOpen(false)}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            variant="danger"
                            disabled={sceneLoading}
                        >
                            {sceneLoading ? 'Deleting...' : 'Delete Scene'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SceneDetail;
