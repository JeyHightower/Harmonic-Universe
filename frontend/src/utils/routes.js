import { API_CONFIG } from "./config";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  UNIVERSES: "/universes",
  UNIVERSE_DETAIL: "/universes/:id",
  UNIVERSE_EDIT: "/universes/:id/edit",
  MODAL_EXAMPLES: "/examples/modals",
  SETTINGS: "/settings",
  ICON_TEST: "/test/icons",
  MODAL_TEST: "/test/modal",
  SIMPLE_MODAL_TEST: "/test/simple-modal",
  STANDALONE_TEST: "/standalone-test",
  MODAL_ACCESSIBILITY_TEST: "/test/modal-accessibility",
  MODAL_ROUTE_TEST: "/test/modal-routes",
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

  [API_MODAL_ROUTES.CREATE_SCENE]: "scene-create",
  [API_MODAL_ROUTES.EDIT_SCENE]: "scene-edit",
  [API_MODAL_ROUTES.DELETE_SCENE]: "scene-delete",

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
