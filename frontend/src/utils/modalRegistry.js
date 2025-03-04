/**
 * Modal Registry - A centralized place to register modals for the application
 *
 * This file demonstrates how to register modals with the ModalContext
 * to enable deep linking and better routing integration.
 */

// Import common modal types
import { useEffect } from 'react';
import useModal from '../hooks/useModal';

// Import modal components
import PhysicsParametersModal from '../features/physicsParameters/PhysicsParametersModal';
import UniverseFormModal from '../features/universe/UniverseFormModal';
import UniverseInfoModal from '../features/universe/UniverseInfoModal';

// Import new modal components
import { API_CONFIG } from './config';

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
    UNIVERSE_INFO: 'universe-info',

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

    // Harmony related modals
    HARMONY_PARAMETERS: 'harmony-parameters',
};

/**
 * ModalRegistry Component
 * This component should be rendered once at the app root level
 * It registers all modals with the modal context
 */
export const ModalRegistry = () => {
    const { registerModal, modalRegistry } = useModal();

    console.log('ModalRegistry component mounted');
    console.log('registerModal function available:', !!registerModal);
    console.log('Current modalRegistry:', modalRegistry);

    useEffect(() => {
        console.log('ModalRegistry useEffect running');

        if (!registerModal) {
            console.error('registerModal function is not available in ModalRegistry');
            return;
        }

        try {
            // Register PhysicsParametersModal
            console.log('Registering PhysicsParametersModal');
            if (!PhysicsParametersModal) {
                console.error('PhysicsParametersModal component is not available');
            } else {
                registerModal(
                    MODAL_TYPES.PHYSICS_PARAMETERS,
                    PhysicsParametersModal,
                    {
                        // getProps transforms URL data into component props
                        getProps: (data = {}) => ({
                            universeId: data.universeId,
                            initialData: data.initialData || null,
                            testMode: false,
                            isGlobalModal: true,
                            onClose: () => { }, // Will be overridden by GlobalModal
                        }),
                        // getModalProps transforms URL data into modal configuration
                        getModalProps: (data = {}) => ({
                            title: data.initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters',
                            size: 'medium',
                            type: 'form',
                        }),
                    }
                );
                console.log('PhysicsParametersModal registered successfully');
            }

            // Register Universe Create/Edit Modal
            console.log('Registering universe-create modal');
            if (!UniverseFormModal) {
                console.error('UniverseFormModal component is not available');
            } else {
                registerModal(
                    MODAL_TYPES.UNIVERSE_CREATE,
                    UniverseFormModal,
                    {
                        getProps: (data = {}) => ({
                            initialData: null,
                            isGlobalModal: true,
                            preventStateReset: true,
                            _mountTime: Date.now(),
                            onClose: () => { }, // Will be overridden by GlobalModal
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
                console.log('universe-create modal registered successfully');
            }

            // Register Universe Edit Modal
            console.log('Registering universe-edit modal');
            if (!UniverseFormModal) {
                console.error('UniverseFormModal component is not available');
            } else {
                registerModal(
                    MODAL_TYPES.UNIVERSE_EDIT,
                    UniverseFormModal,
                    {
                        getProps: (data = {}) => ({
                            universeId: data.universeId,
                            initialData: data.initialData || null,
                            isGlobalModal: true,
                            onClose: () => { }, // Will be overridden by GlobalModal
                        }),
                        getModalProps: () => ({
                            title: 'Edit Universe',
                            size: 'medium',
                            type: 'form',
                        }),
                    }
                );
                console.log('universe-edit modal registered successfully');
            }

            // Register Universe Info Modal
            console.log('Registering universe-info modal');
            if (!UniverseInfoModal) {
                console.error('UniverseInfoModal component is not available');
            } else {
                registerModal(
                    MODAL_TYPES.UNIVERSE_INFO,
                    UniverseInfoModal,
                    {
                        getProps: (data = {}) => ({
                            universe: data.universe,
                            isGlobalModal: true,
                            onClose: () => { }, // Will be overridden by GlobalModal
                        }),
                        getModalProps: (data = {}) => ({
                            title: `${data.universe?.name || 'Universe'} Information`,
                            size: 'medium',
                            type: 'info',
                            animation: 'fade',
                        }),
                    }
                );
                console.log('universe-info modal registered successfully');
            }

            console.log('All modals registered successfully');
        } catch (error) {
            console.error('Error registering modals:', error);
        }
    }, [registerModal, modalRegistry]);

    // This component doesn't render anything
    return null;
};

/**
 * API Route to Modal Type Mapping
 * This maps API routes to modal types for deep linking
 */
export const API_ROUTE_MODALS = {
    // Universe routes
    [`${API_CONFIG.API_PREFIX}/universes`]: MODAL_TYPES.UNIVERSE_CREATE,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId`]: MODAL_TYPES.UNIVERSE_EDIT,

    // Scene routes
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes`]: MODAL_TYPES.SCENE_CREATE,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId`]: MODAL_TYPES.SCENE_EDIT,

    // Physics Object routes
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/physics-objects`]: MODAL_TYPES.PHYSICS_OBJECT,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/physics-objects/:objectId`]: MODAL_TYPES.PHYSICS_OBJECT,

    // Physics Parameters route
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/physics-parameters`]: MODAL_TYPES.PHYSICS_PARAMETERS,

    // Physics Constraint routes
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/physics-constraints`]: MODAL_TYPES.PHYSICS_CONSTRAINT,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/physics-constraints/:constraintId`]: MODAL_TYPES.PHYSICS_CONSTRAINT,

    // Audio routes
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/audio`]: MODAL_TYPES.AUDIO_GENERATE,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/audio/:audioId`]: MODAL_TYPES.AUDIO_DETAILS,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/audio/:audioId/edit`]: MODAL_TYPES.AUDIO_EDIT,

    // Visualization routes
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/visualizations`]: MODAL_TYPES.VISUALIZATION_CREATE,
    [`${API_CONFIG.API_PREFIX}/universes/:universeId/scenes/:sceneId/visualizations/:visualizationId`]: MODAL_TYPES.VISUALIZATION_EDIT,
};

export default ModalRegistry;
