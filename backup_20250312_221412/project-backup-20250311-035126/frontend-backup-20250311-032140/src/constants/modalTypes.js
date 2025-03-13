/**
 * All available modal types in the application.
 * Having these defined as constants ensures type safety and prevents typos.
 */
export const MODAL_TYPES = {
    LOGIN: 'LOGIN',
    REGISTER: 'REGISTER',
    // Add any other modal types your app might need
};

/**
 * Check if a modal type is valid
 * @param {string} type - The modal type to check
 * @returns {boolean} - Whether the type is valid
 */
export const isValidModalType = (type) => {
    return Object.values(MODAL_TYPES).includes(type);
};

/**
 * Get modal type metadata
 * @param {string} type - The modal type
 * @returns {object} - Metadata for the modal type
 */
export const getModalTypeMetadata = (type) => {
    const metadata = {
        [MODAL_TYPES.LOGIN]: {
            title: 'Log In',
            description: 'Log in to your account',
            width: 'sm'
        },
        [MODAL_TYPES.REGISTER]: {
            title: 'Sign Up',
            description: 'Create a new account',
            width: 'sm'
        },
        [MODAL_TYPES.FORGOT_PASSWORD]: {
            title: 'Forgot Password',
            description: 'Reset your password',
            width: 'sm'
        },
        [MODAL_TYPES.RESET_PASSWORD]: {
            title: 'Reset Password',
            description: 'Enter your new password',
            width: 'sm'
        },
        [MODAL_TYPES.CONFIRM]: {
            title: 'Confirm',
            description: 'Please confirm this action',
            width: 'sm'
        },
        [MODAL_TYPES.ALERT]: {
            title: 'Alert',
            description: 'Important information',
            width: 'sm'
        },
        [MODAL_TYPES.INFO]: {
            title: 'Information',
            description: 'Additional information',
            width: 'sm'
        },
        [MODAL_TYPES.ERROR]: {
            title: 'Error',
            description: 'An error occurred',
            width: 'sm'
        },
        [MODAL_TYPES.DEBUG]: {
            title: 'Debug',
            description: 'Debug information',
            width: 'md'
        }
    };

    return metadata[type] || {
        title: type,
        description: 'Modal',
        width: 'md'
    };
};

export default MODAL_TYPES;
