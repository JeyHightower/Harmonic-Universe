/**
 * Registry of modal types used in the application
 */
export const MODAL_TYPES = {
    // Authentication modals
    LOGIN: 'LOGIN',
    SIGNUP: 'SIGNUP',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD_MODAL',

    // User profile modals
    EDIT_PROFILE: 'EDIT_PROFILE_MODAL',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD_MODAL',

    // Content modals
    CREATE_POST: 'CREATE_POST_MODAL',
    EDIT_POST: 'EDIT_POST_MODAL',
    DELETE_CONFIRMATION: 'DELETE_CONFIRMATION_MODAL',

    // Settings modals
    SETTINGS: 'SETTINGS_MODAL',
    PREFERENCES: 'PREFERENCES_MODAL',

    // Feedback modals
    SUCCESS: 'SUCCESS_MODAL',
    ERROR: 'ERROR_MODAL',
    CONFIRMATION: 'CONFIRMATION_MODAL',
    NETWORK_ERROR: 'NETWORK_ERROR_MODAL',

    // Custom modals
    CUSTOM: 'CUSTOM_MODAL',

    // New modals
    CREATE_UNIVERSE: 'CREATE_UNIVERSE',
    EDIT_UNIVERSE: 'EDIT_UNIVERSE',
    DELETE_UNIVERSE: 'DELETE_UNIVERSE',
    SHARE_UNIVERSE: 'SHARE_UNIVERSE',
    USER_SETTINGS: 'USER_SETTINGS',
};

/**
 * Default modal configurations
 */
export const DEFAULT_MODAL_CONFIG = {
    closeOnEscape: true,
    closeOnClickOutside: true,
    showCloseButton: true,
    preventScroll: true,
    width: '500px',
    height: 'auto',
    centered: true
};

/**
 * Utility function to check if a modal type is valid
 * @param {string} modalType - The modal type to check
 * @returns {boolean} Whether the modal type is valid
 */
export const isValidModalType = (modalType) => {
    return Object.values(MODAL_TYPES).includes(modalType);
};

/**
 * Utility function to get modal configuration
 * @param {string} modalType - The modal type
 * @param {Object} customConfig - Custom configuration to merge
 * @returns {Object} The final modal configuration
 */
export const getModalConfig = (modalType, customConfig = {}) => {
    return {
        ...DEFAULT_MODAL_CONFIG,
        ...customConfig
    };
};
