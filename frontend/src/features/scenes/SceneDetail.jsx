import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { fetchSceneById, deleteScene } from '../../store/thunks/scenesThunks';
import SceneFormModal from './SceneFormModal';
import './SceneDetail.css';

const SceneDetail = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { universeId, sceneId } = useParams();
    const { currentScene, loading, error } = useSelector(state => state.scenes);
    const { confirm } = Modal;

    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (sceneId) {
            dispatch(fetchSceneById(sceneId));
        }
    }, [dispatch, sceneId]);

    const handleBackClick = useCallback(() => {
        navigate(`/universes/${universeId}/scenes`);
    }, [navigate, universeId]);

    const handleEditClick = useCallback(() => {
        setShowEditModal(true);
    }, []);

    const handleDeleteClick = useCallback(() => {
        confirm({
            title: 'Are you sure you want to delete this scene?',
            content: 'This action cannot be undone and will remove all associated data.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No, Cancel',
            onOk() {
                dispatch(deleteScene(sceneId)).then(() => {
                    navigate(`/universes/${universeId}/scenes`);
                });
            },
        });
    }, [dispatch, sceneId, universeId, navigate, confirm]);

    const handleModalClose = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (loading) {
        return (
            <div className="scene-detail-loading">
                <Spinner size="large" />
                <p>Loading scene details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="scene-detail-error">
                <h2>Error Loading Scene</h2>
                <p>{typeof error === 'string' ? error : error.message || 'An error occurred'}</p>
                <Button type="primary" onClick={handleBackClick}>
                    Back to Scenes
                </Button>
            </div>
        );
    }

    if (!currentScene) {
        return (
            <div className="scene-detail-not-found">
                <h2>Scene Not Found</h2>
                <p>The scene you're looking for doesn't exist or has been deleted.</p>
                <Button type="primary" onClick={handleBackClick}>
                    Back to Scenes
                </Button>
            </div>
        );
    }

    return (
        <div className="scene-detail-container">
            <div className="scene-detail-header">
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackClick}
                    className="back-button"
                >
                    Back to Scenes
                </Button>
                <div className="scene-detail-actions">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEditClick}
                    >
                        Edit Scene
                    </Button>
                    <Button
                        type="danger"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteClick}
                    >
                        Delete Scene
                    </Button>
                </div>
            </div>

            <div className="scene-detail-content">
                <h1 className="scene-title">{currentScene.name}</h1>

                <div className="scene-metadata">
                    <div className="metadata-item">
                        <span className="metadata-label">Created:</span>
                        <span className="metadata-value">{formatDate(currentScene.created_at)}</span>
                    </div>
                    <div className="metadata-item">
                        <span className="metadata-label">Updated:</span>
                        <span className="metadata-value">{formatDate(currentScene.updated_at)}</span>
                    </div>
                    <div className="metadata-item">
                        <span className="metadata-label">Order:</span>
                        <span className="metadata-value">{currentScene.scene_order}</span>
                    </div>
                </div>

                <div className="scene-section">
                    <h2>Description</h2>
                    <p className="scene-description">
                        {currentScene.description || "No description provided"}
                    </p>
                </div>

                <div className="scene-section">
                    <h2>Physics Parameters</h2>
                    <Button
                        type="primary"
                        onClick={() => navigate(`/universes/${universeId}/scenes/${sceneId}/physics`)}
                    >
                        View/Edit Physics Parameters
                    </Button>
                </div>
            </div>

            {showEditModal && (
                <SceneFormModal
                    universeId={universeId}
                    sceneId={sceneId}
                    initialData={currentScene}
                    onClose={handleModalClose}
                    isCreating={false}
                />
            )}
        </div>
    );
};

export default SceneDetail;
