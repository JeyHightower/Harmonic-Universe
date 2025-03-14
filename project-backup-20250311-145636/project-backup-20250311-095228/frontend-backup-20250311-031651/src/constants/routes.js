export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    ICON_TEST: '/icon-test',
    MODAL_TEST: '/modal-test',
    SIMPLE_MODAL_TEST: '/simple-modal-test',
    STANDALONE_TEST: '/standalone-test',
    MODAL_ACCESSIBILITY_TEST: '/modal-accessibility-test',
    MODAL_EXAMPLES: '/modal-examples',
    UNIVERSES: '/universes',
    UNIVERSE_DETAIL: '/universes/:id',
    UNIVERSE_EDIT: '/universes/:id/edit',
    // Scene routes
    SCENES_LIST: '/universes/:universeId/scenes',
    SCENE_DETAIL: '/universes/:universeId/scenes/:sceneId',
    SCENE_PHYSICS: '/universes/:universeId/scenes/:sceneId/physics',
    NOT_FOUND: '*',
};
