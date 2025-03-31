/**
 * Modal types for the application
 */
export const MODAL_TYPES = {
  // System modals
  ALERT: "ALERT",
  CONFIRMATION: "CONFIRMATION",
  FORM: "FORM",

  // Auth modals
  LOGIN: "LOGIN",
  SIGNUP: "SIGNUP",

  // Universe modals
  UNIVERSE_CREATE: "universe-create",
};

/**
 * Get display name for modal type
 * @param {string} type - The modal type
 * @returns {string} The display name
 */
export const getModalDisplayName = (type) => {
  const displayNames = {
    [MODAL_TYPES.ALERT]: "Alert",
    [MODAL_TYPES.CONFIRMATION]: "Confirmation",
    [MODAL_TYPES.FORM]: "Form",
    [MODAL_TYPES.LOGIN]: "Login",
    [MODAL_TYPES.SIGNUP]: "Sign Up",
    [MODAL_TYPES.UNIVERSE_CREATE]: "Create Universe",
  };

  return displayNames[type] || type;
};

/**
 * Get icon name for modal type
 * @param {string} type - The modal type
 * @returns {string} The icon name
 */
export const getModalIcon = (type) => {
  const icons = {
    [MODAL_TYPES.ALERT]: "alert-circle",
    [MODAL_TYPES.CONFIRMATION]: "check-circle",
    [MODAL_TYPES.FORM]: "form",
    [MODAL_TYPES.LOGIN]: "login",
    [MODAL_TYPES.SIGNUP]: "user-plus",
    [MODAL_TYPES.UNIVERSE_CREATE]: "plus-circle",
  };

  return icons[type] || "question-circle";
};

/**
 * Get description for modal type
 * @param {string} type - The modal type
 * @returns {string} The description
 */
export const getModalDescription = (type) => {
  const descriptions = {
    [MODAL_TYPES.ALERT]: "Display important messages to the user",
    [MODAL_TYPES.CONFIRMATION]: "Get user confirmation for important actions",
    [MODAL_TYPES.FORM]: "Display a form for user input",
    [MODAL_TYPES.LOGIN]: "User login form",
    [MODAL_TYPES.SIGNUP]: "User registration form",
    [MODAL_TYPES.UNIVERSE_CREATE]: "Create a new musical universe",
  };

  return descriptions[type] || "";
};

export default MODAL_TYPES;
