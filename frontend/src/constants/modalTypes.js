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

  // Scene modals
  SCENE_FORM: "SCENE_FORM",

  // Character modals
  CHARACTER_FORM: "CHARACTER_FORM",
  
  // Physics modals
  PHYSICS_OBJECT: "PHYSICS_OBJECT",
  PHYSICS_PARAMETERS: "PHYSICS_PARAMETERS",
  PHYSICS_CONSTRAINT: "PHYSICS_CONSTRAINT",
  
  // Music modals
  MUSIC_CREATE: "music-create",
  MUSIC_VIEW: "music-view",
  MUSIC_EDIT: "music-edit",
  MUSIC_DELETE: "music-delete",
  MUSIC_GENERATE: "audio-generate", // Legacy name for backward compatibility
  MUSIC_DETAILS: "audio-details",   // Legacy name for backward compatibility
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
    [MODAL_TYPES.SCENE_FORM]: "Create Scene",
    [MODAL_TYPES.CHARACTER_FORM]: "Character",
    [MODAL_TYPES.PHYSICS_OBJECT]: "Physics Object",
    [MODAL_TYPES.PHYSICS_PARAMETERS]: "Physics Parameters",
    [MODAL_TYPES.PHYSICS_CONSTRAINT]: "Physics Constraint",
    [MODAL_TYPES.MUSIC_CREATE]: "Create Music",
    [MODAL_TYPES.MUSIC_VIEW]: "View Music",
    [MODAL_TYPES.MUSIC_EDIT]: "Edit Music",
    [MODAL_TYPES.MUSIC_DELETE]: "Delete Music",
    [MODAL_TYPES.MUSIC_GENERATE]: "Generate Music",
    [MODAL_TYPES.MUSIC_DETAILS]: "Music Details",
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
    [MODAL_TYPES.SCENE_FORM]: "film",
    [MODAL_TYPES.CHARACTER_FORM]: "user",
    [MODAL_TYPES.PHYSICS_OBJECT]: "physics",
    [MODAL_TYPES.PHYSICS_PARAMETERS]: "physics",
    [MODAL_TYPES.PHYSICS_CONSTRAINT]: "physics",
    [MODAL_TYPES.MUSIC_CREATE]: "music-note",
    [MODAL_TYPES.MUSIC_VIEW]: "music-note",
    [MODAL_TYPES.MUSIC_EDIT]: "edit",
    [MODAL_TYPES.MUSIC_DELETE]: "delete",
    [MODAL_TYPES.MUSIC_GENERATE]: "music-note-plus",
    [MODAL_TYPES.MUSIC_DETAILS]: "music-note",
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
    [MODAL_TYPES.SCENE_FORM]: "Create a new scene in your universe",
    [MODAL_TYPES.CHARACTER_FORM]: "Create or edit a character",
    [MODAL_TYPES.PHYSICS_OBJECT]: "Create, edit, or delete physics objects",
    [MODAL_TYPES.PHYSICS_PARAMETERS]: "Edit physics object parameters",
    [MODAL_TYPES.PHYSICS_CONSTRAINT]: "Edit physics object constraints",
    [MODAL_TYPES.MUSIC_CREATE]: "Create new music for your universe",
    [MODAL_TYPES.MUSIC_VIEW]: "View and play music from your universe",
    [MODAL_TYPES.MUSIC_EDIT]: "Edit music settings and parameters",
    [MODAL_TYPES.MUSIC_DELETE]: "Delete music from your universe",
    [MODAL_TYPES.MUSIC_GENERATE]: "Generate new music using AI",
    [MODAL_TYPES.MUSIC_DETAILS]: "View detailed information about music",
  };

  return descriptions[type] || "";
};

export default MODAL_TYPES;
