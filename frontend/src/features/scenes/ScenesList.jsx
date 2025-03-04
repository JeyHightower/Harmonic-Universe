import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { clearError } from '../../store/slices/scenesSlice';
import { createScene, deleteScene, fetchScenes } from '../../store/thunks/scenesThunks';
import SceneCard from './SceneCard';
import SceneFormModal from './SceneFormModal';
import './ScenesList.css';

const ScenesList = () => {
    const dispatch = useDispatch();
    const { universeId } = useParams();
    const { scenes, loading, error } = useSelector(state => state.scenes);
    const { confirm } = Modal;

    const [showSceneModal, setShowSceneModal] = useState(false);
    const [sceneToEdit, setSceneToEdit] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch scenes when component mounts
    useEffect(() => {
        if (universeId) {
            dispatch(fetchScenes(universeId));
        }

        return () => {
            dispatch(clearError());
        };
    }, [dispatch, universeId]);

    // Filter scenes based on search term
    const filteredScenes = scenes.filter(scene =>
        scene.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (scene.description && scene.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort scenes by scene_order
    const sortedScenes = [...filteredScenes].sort((a, b) => a.scene_order - b.scene_order);

    const handleCreateClick = useCallback(() => {
        setSceneToEdit(null);
        setIsCreating(true);
        setShowSceneModal(true);
    }, []);

    const handleEditClick = useCallback(scene => {
        setSceneToEdit(scene);
        setIsCreating(false);
        setShowSceneModal(true);
    }, []);

    const handleDeleteClick = useCallback(
        sceneId => {
            confirm({
                title: 'Are you sure you want to delete this scene?',
                content: 'This action cannot be undone.',
                okText: 'Yes, Delete',
                okType: 'danger',
                cancelText: 'No, Cancel',
                onOk() {
                    dispatch(deleteScene(sceneId));
                },
            });
        },
        [dispatch, confirm]
    );

    const handleModalClose = useCallback(() => {
        setShowSceneModal(false);
        setSceneToEdit(null);
    }, []);

    const handleSearchChange = useCallback(e => {
        setSearchTerm(e.target.value);
    }, []);

    return (
        <div className="scenes-list-container">
            <div className="scenes-list-header">
                <h1>Scenes</h1>
                <div className="scenes-list-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search scenes..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateClick}
                    >
                        Create Scene
                    </Button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {typeof error === 'string' ? error : error.message || 'An error occurred'}
                </div>
            )}

            {loading ? (
                <div className="scenes-loading">
                    <Spinner size="large" />
                    <p>Loading scenes...</p>
                </div>
            ) : sortedScenes.length === 0 ? (
                <div className="no-scenes">
                    <p>
                        {searchTerm
                            ? 'No scenes match your search.'
                            : 'No scenes found for this universe. Create your first scene!'}
                    </p>
                    {!searchTerm && (
                        <Button type="primary" onClick={handleCreateClick}>
                            Create Scene
                        </Button>
                    )}
                </div>
            ) : (
                <div className="scenes-grid">
                    {sortedScenes.map(scene => (
                        <SceneCard
                            key={scene.id}
                            scene={scene}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            {showSceneModal && (
                <SceneFormModal
                    universeId={universeId}
                    sceneId={sceneToEdit?.id}
                    initialData={sceneToEdit}
                    onClose={handleModalClose}
                    isCreating={isCreating}
                />
            )}
        </div>
    );
};

export default ScenesList;
