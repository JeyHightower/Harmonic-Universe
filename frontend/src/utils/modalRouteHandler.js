/**
 * Modal Route Handler
 *
 * This utility handles the mapping between API routes and modal components.
 * It allows for deep linking to modals and handling API routes that should open modals.
 */

import { matchPath } from 'react-router-dom';
import { API_MODAL_ROUTES, API_ROUTE_TO_MODAL_TYPE } from '../routes';
import { MODAL_TYPES } from './modalRegistry';

/**
 * Check if a given path matches any of our API modal routes
 * @param {string} path - The path to check
 * @returns {Object|null} The match result or null if no match
 */
export const matchModalRoute = (path) => {
    // Check each API route pattern for a match
    for (const [routeKey, routePattern] of Object.entries(API_MODAL_ROUTES)) {
        // Convert route pattern to regex pattern (e.g. /api/users/:id/profile -> /api/users/[^/]+/profile)
        const regexPattern = routePattern.replace(/:\w+/g, '[^/]+');

        // Create a match pattern that react-router can use
        const match = matchPath(
            { path: regexPattern, end: true },
            path
        );

        if (match) {
            return {
                route: routeKey,
                pattern: routePattern,
                params: match.params,
                modalType: API_ROUTE_TO_MODAL_TYPE[routeKey]
            };
        }
    }

    return null;
};

/**
 * Extract parameters from a path based on a route pattern
 * @param {string} pattern - The route pattern with placeholders (e.g. /api/users/:id/profile)
 * @param {string} path - The actual path (e.g. /api/users/123/profile)
 * @returns {Object} The extracted parameters (e.g. { id: '123' })
 */
export const extractParamsFromPath = (pattern, path) => {
    const params = {};

    // Split both strings by '/'
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    // Match corresponding parts
    for (let i = 0; i < patternParts.length; i++) {
        // If this part of the pattern starts with ':', it's a parameter
        if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].substring(1);
            params[paramName] = pathParts[i];
        }
    }

    return params;
};

/**
 * Get modal data from an API route
 * @param {string} path - The API route path
 * @returns {Object|null} Modal data or null if no matching route
 */
export const getModalDataFromRoute = (path) => {
    const match = matchModalRoute(path);

    if (!match) return null;

    const { modalType, pattern } = match;
    const params = extractParamsFromPath(pattern, path);

    // Prepare data based on modal type
    switch (modalType) {
        case MODAL_TYPES.UNIVERSE_CREATE:
            return { modalType };

        case MODAL_TYPES.UNIVERSE_EDIT:
            return {
                modalType,
                data: { universeId: params.id }
            };

        case MODAL_TYPES.UNIVERSE_DELETE:
            return {
                modalType,
                data: {
                    entityType: 'universe',
                    entityId: params.id
                }
            };

        case MODAL_TYPES.SCENE_CREATE:
            return {
                modalType,
                data: { universeId: params.universeId }
            };

        case MODAL_TYPES.SCENE_EDIT:
            return {
                modalType,
                data: {
                    universeId: params.universeId,
                    sceneId: params.id
                }
            };

        case MODAL_TYPES.SCENE_DELETE:
            return {
                modalType,
                data: {
                    entityType: 'scene',
                    entityId: params.id
                }
            };

        case MODAL_TYPES.PHYSICS_OBJECT:
            return {
                modalType,
                data: {
                    sceneId: params.sceneId,
                    ...(params.id ? { initialData: { id: params.id } } : {})
                }
            };

        case MODAL_TYPES.PHYSICS_PARAMETERS:
            return {
                modalType,
                data: {
                    universeId: params.universeId,
                    ...(params.id ? { initialData: { id: params.id } } : {})
                }
            };

        case MODAL_TYPES.USER_PROFILE:
            return {
                modalType,
                data: { userId: params.id }
            };

        case MODAL_TYPES.AUDIO_GENERATE:
            return {
                modalType,
                data: {
                    universeId: params.universeId,
                    sceneId: params.sceneId
                }
            };

        case MODAL_TYPES.AUDIO_DETAILS:
            return {
                modalType,
                data: { audioId: params.id }
            };

        case MODAL_TYPES.VISUALIZATION_CREATE:
            return {
                modalType,
                data: {
                    universeId: params.universeId,
                    sceneId: params.sceneId
                }
            };

        case MODAL_TYPES.VISUALIZATION_EDIT:
            return {
                modalType,
                data: {
                    visualizationId: params.id
                }
            };

        case MODAL_TYPES.PHYSICS_CONSTRAINT:
            return {
                modalType,
                data: {
                    sceneId: params.sceneId,
                    ...(params.id ? { initialData: { id: params.id } } : {})
                }
            };

        case 'confirm-delete':
            // Handle all delete confirmations
            if (path.includes('/universes/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'universe',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/scenes/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'scene',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/physics-objects/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'physics object',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/physics-parameters/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'physics parameters',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/audio/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'audio track',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/visualizations/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'visualization',
                        entityId: params.id
                    }
                };
            } else if (path.includes('/physics-constraints/')) {
                return {
                    modalType,
                    data: {
                        entityType: 'physics constraint',
                        entityId: params.id
                    }
                };
            }
            return null;

        default:
            return null;
    }
};

/**
 * Handle an API route by opening the appropriate modal
 * @param {string} path - The API route path
 * @param {Function} openModalByType - The openModalByType function from useModal
 * @returns {boolean} True if a modal was opened, false otherwise
 */
export const handleModalRoute = (path, openModalByType) => {
    const modalData = getModalDataFromRoute(path);

    if (!modalData) return false;

    const { modalType, data = {} } = modalData;
    openModalByType(modalType, data);

    return true;
};

export default {
    matchModalRoute,
    extractParamsFromPath,
    getModalDataFromRoute,
    handleModalRoute
};
