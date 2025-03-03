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

/**
 * Modal Types Constants
 * Define constants for all modal types to avoid typos
 */
export const MODAL_TYPES = {
    // Physics related modals
    PHYSICS_PARAMETERS: 'physics-parameters',
    PHYSICS_OBJECT: 'physics-object',

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

    useEffect(() => {
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
        registerModal(
            MODAL_TYPES.UNIVERSE_CREATE,
            UniverseFormModal,
            {
                getProps: (data) => ({
                    initialData: null,
                    isGlobalModal: true,
                }),
                getModalProps: () => ({
                    title: 'Create New Universe',
                    size: 'medium',
                    type: 'form',
                }),
            }
        );

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

    }, [registerModal]);

    return null; // This component doesn't render anything
};

/**
 * Example usage in application code:
 *
 * // Open a modal by type
 * const { openModalByType } = useModal();
 *
 * // Open the physics parameters modal
 * openModalByType(MODAL_TYPES.PHYSICS_PARAMETERS, {
 *   universeId: '123',
 *   initialData: { ... } // optional
 * });
 *
 * // Get a deep link URL to a modal
 * const { getModalUrl } = useModal();
 * const modalUrl = getModalUrl(MODAL_TYPES.PHYSICS_PARAMETERS, {
 *   universeId: '123'
 * });
 *
 * // Can be used for sharing links or bookmarking
 * <a href={modalUrl}>Open Physics Parameters</a>
 */

export default ModalRegistry;
