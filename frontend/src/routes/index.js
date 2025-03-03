// This file now only exports route constants to avoid circular dependencies

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UNIVERSES: '/universes',
  UNIVERSE_DETAIL: '/universes/:id',
  UNIVERSE_EDIT: '/universes/:id/edit',
  MODAL_EXAMPLES: '/examples/modals',
  SETTINGS: '/settings',
  ICON_TEST: '/test/icons',
  MODAL_TEST: '/test/modal',
  SIMPLE_MODAL_TEST: '/test/simple-modal',
  STANDALONE_TEST: '/standalone-test',
  MODAL_ACCESSIBILITY_TEST: '/test/modal-accessibility',
};

// API routes that can be accessed via modals
export const API_MODAL_ROUTES = {
  // Universe routes
  CREATE_UNIVERSE: '/api/universes/create',
  EDIT_UNIVERSE: '/api/universes/:id/edit',
  DELETE_UNIVERSE: '/api/universes/:id/delete',

  // Scene routes
  CREATE_SCENE: '/api/scenes/create',
  EDIT_SCENE: '/api/scenes/:id/edit',
  DELETE_SCENE: '/api/scenes/:id/delete',

  // Physics objects routes
  CREATE_PHYSICS_OBJECT: '/api/physics-objects/create',
  EDIT_PHYSICS_OBJECT: '/api/physics-objects/:id/edit',
  DELETE_PHYSICS_OBJECT: '/api/physics-objects/:id/delete',

  // Physics parameters routes
  CREATE_PHYSICS_PARAMETERS: '/api/physics-parameters/create',
  EDIT_PHYSICS_PARAMETERS: '/api/physics-parameters/:id/edit',

  // User routes
  USER_PROFILE: '/api/users/:id/profile',
};

// Map API routes to modal types
export const API_ROUTE_TO_MODAL_TYPE = {
  [API_MODAL_ROUTES.CREATE_UNIVERSE]: 'universe-create',
  [API_MODAL_ROUTES.EDIT_UNIVERSE]: 'universe-edit',
  [API_MODAL_ROUTES.DELETE_UNIVERSE]: 'universe-delete',

  [API_MODAL_ROUTES.CREATE_SCENE]: 'scene-create',
  [API_MODAL_ROUTES.EDIT_SCENE]: 'scene-edit',
  [API_MODAL_ROUTES.DELETE_SCENE]: 'scene-delete',

  [API_MODAL_ROUTES.CREATE_PHYSICS_OBJECT]: 'physics-object',
  [API_MODAL_ROUTES.EDIT_PHYSICS_OBJECT]: 'physics-object',
  [API_MODAL_ROUTES.DELETE_PHYSICS_OBJECT]: 'confirm-delete',

  [API_MODAL_ROUTES.CREATE_PHYSICS_PARAMETERS]: 'physics-parameters',
  [API_MODAL_ROUTES.EDIT_PHYSICS_PARAMETERS]: 'physics-parameters',

  [API_MODAL_ROUTES.USER_PROFILE]: 'user-profile',
};

// No longer exporting router object since routes are defined in App.jsx
