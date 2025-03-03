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
};

// No longer exporting router object since routes are defined in App.jsx
