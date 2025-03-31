import { API_CONFIG } from "./config";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  UNIVERSES: "/universes",
  UNIVERSE_DETAIL: "/universes/:id",
  UNIVERSE_EDIT: "/universes/:id/edit",
  SCENES: "/universes/:universeId/scenes",
  SCENE_DETAIL: "/universes/:universeId/scenes/:sceneId",
  SCENE_EDIT: "/universes/:universeId/scenes/:sceneId/edit",
  MODAL_EXAMPLES: "/examples/modals",
  SETTINGS: "/settings",
  ICON_TEST: "/test/icons",
  MODAL_TEST: "/test/modal",
  SIMPLE_MODAL_TEST: "/test/simple-modal",
  STANDALONE_TEST: "/standalone-test",
  MODAL_ACCESSIBILITY_TEST: "/test/modal-accessibility",
  MODAL_ROUTE_TEST: "/test/modal-routes",

  // Updated character routes - now at universe level too
  CHARACTERS: "/universes/:universeId/characters",
  CHARACTERS_FOR_SCENE: "/universes/:universeId/scenes/:sceneId/characters",
  CHARACTER_DETAIL: "/universes/:universeId/characters/:characterId",
  CHARACTER_EDIT: "/universes/:universeId/characters/:characterId/edit",

  // Updated notes routes
  NOTES: "/universes/:universeId/notes",
  NOTES_FOR_SCENE: "/universes/:universeId/scenes/:sceneId/notes",
  NOTES_FOR_CHARACTER: "/universes/:universeId/characters/:characterId/notes",
  NOTE_DETAIL: "/universes/:universeId/notes/:noteId",
  NOTE_EDIT: "/universes/:universeId/notes/:noteId/edit",
};

export const API_MODAL_ROUTES = {
  // Auth routes
  LOGIN: `${API_CONFIG.API_PREFIX}/auth/login`,
  REGISTER: `${API_CONFIG.API_PREFIX}/auth/register`,

  // Universe routes
  CREATE_UNIVERSE: `${API_CONFIG.API_PREFIX}/universes/create`,
  EDIT_UNIVERSE: `${API_CONFIG.API_PREFIX}/universes/:id/edit`,
  DELETE_UNIVERSE: `${API_CONFIG.API_PREFIX}/universes/:id/delete`,

  // Scene routes
  CREATE_SCENE: `${API_CONFIG.API_PREFIX}/scenes/create`,
  EDIT_SCENE: `${API_CONFIG.API_PREFIX}/scenes/:id/edit`,
  DELETE_SCENE: `${API_CONFIG.API_PREFIX}/scenes/:id/delete`,

  // Character routes
  CREATE_CHARACTER: `${API_CONFIG.API_PREFIX}/characters/create`,
  EDIT_CHARACTER: `${API_CONFIG.API_PREFIX}/characters/:id/edit`,
  DELETE_CHARACTER: `${API_CONFIG.API_PREFIX}/characters/:id/delete`,

  // Note routes
  CREATE_NOTE: `${API_CONFIG.API_PREFIX}/notes/create`,
  EDIT_NOTE: `${API_CONFIG.API_PREFIX}/notes/:id/edit`,
  DELETE_NOTE: `${API_CONFIG.API_PREFIX}/notes/:id/delete`,
  ARCHIVE_NOTE: `${API_CONFIG.API_PREFIX}/notes/:id/archive`,
  UNARCHIVE_NOTE: `${API_CONFIG.API_PREFIX}/notes/:id/unarchive`,

  // Physics objects routes
  CREATE_PHYSICS_OBJECT: `${API_CONFIG.API_PREFIX}/physics-objects/create`,
  EDIT_PHYSICS_OBJECT: `${API_CONFIG.API_PREFIX}/physics-objects/:id/edit`,
  DELETE_PHYSICS_OBJECT: `${API_CONFIG.API_PREFIX}/physics-objects/:id/delete`,

  // Physics parameters routes
  CREATE_PHYSICS_PARAMETERS: `${API_CONFIG.API_PREFIX}/physics-parameters/create`,
  EDIT_PHYSICS_PARAMETERS: `${API_CONFIG.API_PREFIX}/physics-parameters/:id/edit`,
  DELETE_PHYSICS_PARAMETERS: `${API_CONFIG.API_PREFIX}/physics-parameters/:id/delete`,

  // User routes
  USER_PROFILE: `${API_CONFIG.API_PREFIX}/users/:id/profile`,

  // Audio routes
  GENERATE_AUDIO: `${API_CONFIG.API_PREFIX}/audio/generate`,
  AUDIO_DETAILS: `${API_CONFIG.API_PREFIX}/audio/:id/details`,
  DELETE_AUDIO: `${API_CONFIG.API_PREFIX}/audio/:id/delete`,

  // Visualization routes
  CREATE_VISUALIZATION: `${API_CONFIG.API_PREFIX}/visualizations/create`,
  EDIT_VISUALIZATION: `${API_CONFIG.API_PREFIX}/visualizations/:id/edit`,
  DELETE_VISUALIZATION: `${API_CONFIG.API_PREFIX}/visualizations/:id/delete`,

  // Physics constraints routes
  CREATE_PHYSICS_CONSTRAINT: `${API_CONFIG.API_PREFIX}/physics-constraints/create`,
  EDIT_PHYSICS_CONSTRAINT: `${API_CONFIG.API_PREFIX}/physics-constraints/:id/edit`,
  DELETE_PHYSICS_CONSTRAINT: `${API_CONFIG.API_PREFIX}/physics-constraints/:id/delete`,
};

export const API_ROUTE_TO_MODAL_TYPE = {
  // Auth routes
  [API_MODAL_ROUTES.LOGIN]: "login",
  [API_MODAL_ROUTES.REGISTER]: "register",

  // Universe routes
  [API_MODAL_ROUTES.CREATE_UNIVERSE]: "universe-create",
  [API_MODAL_ROUTES.EDIT_UNIVERSE]: "universe-edit",
  [API_MODAL_ROUTES.DELETE_UNIVERSE]: "universe-delete",

  // Scene routes
  [API_MODAL_ROUTES.CREATE_SCENE]: "scene-create",
  [API_MODAL_ROUTES.EDIT_SCENE]: "scene-edit",
  [API_MODAL_ROUTES.DELETE_SCENE]: "scene-delete",

  // Character routes
  [API_MODAL_ROUTES.CREATE_CHARACTER]: "character-create",
  [API_MODAL_ROUTES.EDIT_CHARACTER]: "character-edit",
  [API_MODAL_ROUTES.DELETE_CHARACTER]: "character-delete",

  // Note routes
  [API_MODAL_ROUTES.CREATE_NOTE]: "note-create",
  [API_MODAL_ROUTES.EDIT_NOTE]: "note-edit",
  [API_MODAL_ROUTES.DELETE_NOTE]: "note-delete",
  [API_MODAL_ROUTES.ARCHIVE_NOTE]: "note-archive",
  [API_MODAL_ROUTES.UNARCHIVE_NOTE]: "note-unarchive",

  // Physics routes
  [API_MODAL_ROUTES.CREATE_PHYSICS_OBJECT]: "physics-object",
  [API_MODAL_ROUTES.EDIT_PHYSICS_OBJECT]: "physics-object",
  [API_MODAL_ROUTES.DELETE_PHYSICS_OBJECT]: "confirm-delete",

  [API_MODAL_ROUTES.CREATE_PHYSICS_PARAMETERS]: "physics-parameters",
  [API_MODAL_ROUTES.EDIT_PHYSICS_PARAMETERS]: "physics-parameters",
  [API_MODAL_ROUTES.DELETE_PHYSICS_PARAMETERS]: "confirm-delete",

  [API_MODAL_ROUTES.USER_PROFILE]: "user-profile",

  [API_MODAL_ROUTES.GENERATE_AUDIO]: "audio-generate",
  [API_MODAL_ROUTES.AUDIO_DETAILS]: "audio-details",
  [API_MODAL_ROUTES.DELETE_AUDIO]: "confirm-delete",

  [API_MODAL_ROUTES.CREATE_VISUALIZATION]: "visualization-create",
  [API_MODAL_ROUTES.EDIT_VISUALIZATION]: "visualization-edit",
  [API_MODAL_ROUTES.DELETE_VISUALIZATION]: "confirm-delete",

  [API_MODAL_ROUTES.CREATE_PHYSICS_CONSTRAINT]: "physics-constraint",
  [API_MODAL_ROUTES.EDIT_PHYSICS_CONSTRAINT]: "physics-constraint",
  [API_MODAL_ROUTES.DELETE_PHYSICS_CONSTRAINT]: "confirm-delete",
};
