/**
 * Modal Registry - A centralized place to register modals for the application
 *
 * This file demonstrates how to register modals with the ModalContext
 * to enable deep linking and better routing integration.
 */

// Import common modal types
import { useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';

// Import modal components
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import UserProfileModal from '../features/auth/UserProfileModal';
import PhysicsObjectFormModal from '../features/physicsObjects/PhysicsObjectFormModal';
import PhysicsParametersModal from '../features/physicsParameters/PhysicsParametersModal';
import SceneFormModal from '../features/scenes/SceneFormModal';
import UniverseFormModal from '../features/universe/UniverseFormModal';

// Import new modal components
import AudioDetailsModal from '../features/audio/AudioDetailsModal';
import AudioGenerationModal from '../features/audio/AudioGenerationModal';
import PhysicsConstraintModal from '../features/physicsConstraints/PhysicsConstraintModal';
import VisualizationFormModal from '../features/visualization/VisualizationFormModal';

/**
 * Modal Types Constants
 * Define constants for all modal types to avoid typos
 */
export const MODAL_TYPES = {
    // Physics related modals
    PHYSICS_PARAMETERS: 'physics-parameters',
    PHYSICS_OBJECT: 'physics-object',
    PHYSICS_CONSTRAINT: 'physics-constraint',

    // Universe related modals
    UNIVERSE_CREATE: 'universe-create',
    UNIVERSE_EDIT: 'universe-edit',
    UNIVERSE_DELETE: 'universe-delete',

    // Scene related modals
    SCENE_CREATE: 'scene-create',
    SCENE_EDIT: 'scene-edit',
    SCENE_DELETE: 'scene-delete',

    // User related modals
    USER_PROFILE: 'user-profile',

    // Audio related modals
    AUDIO_GENERATE: 'audio-generate',
    AUDIO_DETAILS: 'audio-details',
    AUDIO_EDIT: 'audio-edit',

    // Visualization related modals
    VISUALIZATION_CREATE: 'visualization-create',
    VISUALIZATION_EDIT: 'visualization-edit',

    // Confirmation modals
    CONFIRM_DELETE: 'confirm-delete',
};

/**
 * ModalRegistry Component
 * This component should be rendered once at the app root level
 * It registers all modals with the modal context
 */
export const ModalRegistry = () => {
    const { registerModal } = useModal();

    console.log('ModalRegistry component mounted');
    console.log('registerModal function available:', !!registerModal);

    useEffect(() => {
        console.log('ModalRegistry useEffect running');

        // Register PhysicsParametersModal
        registerModal(
            MODAL_TYPES.PHYSICS_PARAMETERS,
            PhysicsParametersModal,
            {
                // getProps transforms URL data into component props
                getProps: (data) => ({
                    universeId: data.universeId,
                    initialData: data.initialData || null,
                    testMode: false,
                    isGlobalModal: true,
                }),
                // getModalProps transforms URL data into modal configuration
                getModalProps: (data) => ({
                    title: data.initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register Universe Create/Edit Modal
        console.log('Registering universe-create modal');
        console.log('MODAL_TYPES.UNIVERSE_CREATE:', MODAL_TYPES.UNIVERSE_CREATE);
        console.log('UniverseFormModal available:', !!UniverseFormModal);

        registerModal(
            MODAL_TYPES.UNIVERSE_CREATE,
            UniverseFormModal,
            {
                getProps: (data) => ({
                    initialData: null,
                    isGlobalModal: true,
                    preventStateReset: true,
                    _mountTime: Date.now(),
                }),
                getModalProps: () => ({
                    title: 'Create New Universe',
                    size: 'medium',
                    type: 'form',
                    preventStateReset: true,
                    preventAutoClose: true,
                    preventBackdropClick: true,
                    'data-modal-type': 'universe-create',
                }),
            }
        );
        console.log('universe-create modal registered');

        registerModal(
            MODAL_TYPES.UNIVERSE_EDIT,
            UniverseFormModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Edit Universe',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register Scene Create/Edit Modal
        registerModal(
            MODAL_TYPES.SCENE_CREATE,
            SceneFormModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    initialData: null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Create New Scene',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        registerModal(
            MODAL_TYPES.SCENE_EDIT,
            SceneFormModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Edit Scene',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register Physics Object Modal
        registerModal(
            MODAL_TYPES.PHYSICS_OBJECT,
            PhysicsObjectFormModal,
            {
                getProps: (data) => ({
                    sceneId: data.sceneId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: (data) => ({
                    title: data.initialData ? 'Edit Physics Object' : 'Create Physics Object',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register Physics Constraint Modal
        registerModal(
            MODAL_TYPES.PHYSICS_CONSTRAINT,
            PhysicsConstraintModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    constraintId: data.constraintId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: (data) => ({
                    title: data.constraintId ? 'Edit Physics Constraint' : 'Create Physics Constraint',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register User Profile Modal
        registerModal(
            MODAL_TYPES.USER_PROFILE,
            UserProfileModal,
            {
                getProps: (data) => ({
                    userId: data.userId,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'User Profile',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

        // Register Confirm Delete Modal
        registerModal(
            MODAL_TYPES.CONFIRM_DELETE,
            ConfirmDeleteModal,
            {
                getProps: (data) => ({
                    entityType: data.entityType,
                    entityId: data.entityId,
                    entityName: data.entityName,
                    onConfirm: data.onConfirm,
                    isGlobalModal: true,
                }),
                getModalProps: (data) => ({
                    title: `Delete ${data.entityType}`,
                    size: 'small',
                    type: 'confirm',
                    preventBackdropClick: true,
                }),
            }
        );

        // Register Audio Generation Modal
        registerModal(
            MODAL_TYPES.AUDIO_GENERATE,
            AudioGenerationModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    initialData: null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Generate Audio',
                    size: 'large',
                    type: 'form',
                }),
            }
        );

        // Register Audio Edit Modal
        registerModal(
            MODAL_TYPES.AUDIO_EDIT,
            AudioGenerationModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    audioId: data.audioId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Edit Audio',
                    size: 'large',
                    type: 'form',
                }),
            }
        );

        // Register Audio Details Modal
        registerModal(
            MODAL_TYPES.AUDIO_DETAILS,
            AudioDetailsModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    audioId: data.audioId,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Audio Details',
                    size: 'medium',
                    type: 'info',
                }),
            }
        );

        // Register Visualization Create Modal
        registerModal(
            MODAL_TYPES.VISUALIZATION_CREATE,
            VisualizationFormModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    initialData: null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Create Visualization',
                    size: 'large',
                    type: 'form',
                }),
            }
        );

        // Register Visualization Edit Modal
        registerModal(
            MODAL_TYPES.VISUALIZATION_EDIT,
            VisualizationFormModal,
            {
                getProps: (data) => ({
                    universeId: data.universeId,
                    sceneId: data.sceneId,
                    visualizationId: data.visualizationId,
                    initialData: data.initialData || null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Edit Visualization',
                    size: 'large',
                    type: 'form',
                }),
            }
        );

        console.log('All modals registered');
    }, [registerModal]);

    // This component doesn't render anything
    return null;
};

/**
 * API Route to Modal Type Mapping
 * This maps API routes to modal types for deep linking
 */
export const API_ROUTE_MODALS = {
    // Universe routes
    '/api/v1/universes': MODAL_TYPES.UNIVERSE_CREATE,
    '/api/v1/universes/:universeId': MODAL_TYPES.UNIVERSE_EDIT,

    // Scene routes
    '/api/v1/universes/:universeId/scenes': MODAL_TYPES.SCENE_CREATE,
    '/api/v1/universes/:universeId/scenes/:sceneId': MODAL_TYPES.SCENE_EDIT,

    // Physics Object routes
    '/api/v1/universes/:universeId/scenes/:sceneId/physics-objects': MODAL_TYPES.PHYSICS_OBJECT,
    '/api/v1/universes/:universeId/scenes/:sceneId/physics-objects/:objectId': MODAL_TYPES.PHYSICS_OBJECT,

    // Physics Parameters route
    '/api/v1/universes/:universeId/scenes/:sceneId/physics-parameters': MODAL_TYPES.PHYSICS_PARAMETERS,

    // Physics Constraint routes
    '/api/v1/universes/:universeId/scenes/:sceneId/physics-constraints': MODAL_TYPES.PHYSICS_CONSTRAINT,
    '/api/v1/universes/:universeId/scenes/:sceneId/physics-constraints/:constraintId': MODAL_TYPES.PHYSICS_CONSTRAINT,

    // Audio routes
    '/api/v1/universes/:universeId/scenes/:sceneId/audio': MODAL_TYPES.AUDIO_GENERATE,
    '/api/v1/universes/:universeId/scenes/:sceneId/audio/:audioId': MODAL_TYPES.AUDIO_DETAILS,
    '/api/v1/universes/:universeId/scenes/:sceneId/audio/:audioId/edit': MODAL_TYPES.AUDIO_EDIT,

    // Visualization routes
    '/api/v1/universes/:universeId/scenes/:sceneId/visualizations': MODAL_TYPES.VISUALIZATION_CREATE,
    '/api/v1/universes/:universeId/scenes/:sceneId/visualizations/:visualizationId': MODAL_TYPES.VISUALIZATION_EDIT,
};

export default ModalRegistry;
