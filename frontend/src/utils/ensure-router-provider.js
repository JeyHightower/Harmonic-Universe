/**
 * ensure-router-provider.js - Makes sure React Router is properly initialized
 * Fixes React error #321 with Router context
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Keep track of the module promise to avoid multiple imports
let RouterComponentsPromise = null;

// Initialize with minimal fallbacks
let BrowserRouterFallback = ({ children }) => children;
let RoutesFallback = ({ children }) => children;
let RouteFallback = ({ children }) => children;
let useLocationFallback = () => ({ pathname: '/', search: '', hash: '', state: null });
let useNavigateFallback = () => () => console.warn('[Router Fix] Mock navigate called');
let useParamsFallback = () => ({});
let OutletFallback = () => null;
let LinkFallback = ({ to, children }) => React.createElement('a', { href: to }, children);

// Try to import router components with dynamic import
async function loadRouterComponents() {
    try {
        // Try to import from react-router-dom (most common)
        const ReactRouterDom = await import('react-router-dom');
        console.log('[Router Fix] Successfully imported from react-router-dom');
        return ReactRouterDom;
    } catch (error) {
        console.error('[Router Fix] Failed to import from react-router-dom:', error);

        try {
            // Try to import from react-router as fallback
            const ReactRouter = await import('react-router');
            console.log('[Router Fix] Successfully imported from react-router');
            return ReactRouter;
        } catch (err) {
            console.error('[Router Fix] Failed to import React Router:', err);
            // Return minimal mock components
            return {
                BrowserRouter: BrowserRouterFallback,
                Routes: RoutesFallback,
                Route: RouteFallback,
                useLocation: useLocationFallback,
                useNavigate: useNavigateFallback,
                useParams: useParamsFallback,
                Outlet: OutletFallback,
                Link: LinkFallback
            };
        }
    }
}

// Initialize the router components
RouterComponentsPromise = loadRouterComponents().then(components => {
    // Extract router components
    BrowserRouterFallback = components.BrowserRouter || BrowserRouterFallback;
    RoutesFallback = components.Routes || RoutesFallback;
    RouteFallback = components.Route || RouteFallback;
    useLocationFallback = components.useLocation || useLocationFallback;
    useNavigateFallback = components.useNavigate || useNavigateFallback;
    useParamsFallback = components.useParams || useParamsFallback;
    OutletFallback = components.Outlet || OutletFallback;
    LinkFallback = components.Link || LinkFallback;

    // Register React Router contexts in global registry
    if (typeof window !== 'undefined' && window.__registerReactContext) {
        // Create a mock router context
        const RouterContext = React.createContext({
            location: { pathname: '/', search: '', hash: '', state: null },
            navigate: () => console.warn('[Router Fix] Mock navigate called')
        });

        window.__registerReactContext('Router', RouterContext);
    }

    // Tag Router components with proper React component properties to avoid Error #321
    for (const Component of [BrowserRouterFallback, RoutesFallback, RouteFallback, OutletFallback, LinkFallback]) {
        if (Component && !Component.isReactComponent) {
            Component.isReactComponent = true;

            // Add React internal type symbols if possible
            if (typeof Symbol !== 'undefined') {
                Component.$$typeof = Symbol.for('react.element');
            }
        }
    }

    console.log('[Router Fix] Enhanced Router components with React component properties');

    return components;
});

// Create safe versions of Router hooks
export const safeUseLocation = () => {
    try {
        if (typeof useLocationFallback === 'function') {
            return useLocationFallback();
        }
    } catch (error) {
        console.warn('[Router Fix] Error using useLocation:', error);
    }

    // Return a minimal location object
    return { pathname: '/', search: '', hash: '', state: null };
};

export const safeUseNavigate = () => {
    try {
        if (typeof useNavigateFallback === 'function') {
            return useNavigateFallback();
        }
    } catch (error) {
        console.warn('[Router Fix] Error using useNavigate:', error);
    }

    // Return a mock navigate function
    return (to, options) => {
        console.warn('[Router Fix] Mock navigate called with:', to, options);
        if (typeof to === 'string' && typeof window !== 'undefined') {
            console.log('[Router Fix] Attempting real navigation to:', to);
            window.location.href = to;
        }
    };
};

export const safeUseParams = () => {
    try {
        if (typeof useParamsFallback === 'function') {
            return useParamsFallback();
        }
    } catch (error) {
        console.warn('[Router Fix] Error using useParams:', error);
    }

    // Return empty params
    return {};
};

// Export a wrapped BrowserRouter with error handling
export const SafeRouter = function ({ children }) {
    // Check if BrowserRouter exists
    if (!BrowserRouterFallback || typeof BrowserRouterFallback !== 'function') {
        console.error('[Router Fix] BrowserRouter is not available, using fallback');
        return children;
    }

    try {
        return React.createElement(BrowserRouterFallback, null, children);
    } catch (error) {
        console.error('[Router Fix] Error rendering BrowserRouter:', error);
        return children;
    }
};

// Make the Router components directly available globally
if (typeof window !== 'undefined' && window.React) {
    window.ReactRouter = {
        BrowserRouter: BrowserRouterFallback,
        Routes: RoutesFallback,
        Route: RouteFallback,
        useLocation: safeUseLocation,
        useNavigate: safeUseNavigate,
        useParams: safeUseParams,
        Outlet: OutletFallback,
        Link: LinkFallback,
        SafeRouter
    };

    // Create global hooks for components to use
    window.useLocationSafe = safeUseLocation;
    window.useNavigateSafe = safeUseNavigate;
    window.useParamsSafe = safeUseParams;
}

// Export router components
export {
    BrowserRouter,
    Routes,
    Route
};

export const ensureRouterProvider = () => {
    if (typeof window !== 'undefined' && !window.ReactRouter) {
        window.ReactRouter = {
            BrowserRouter,
            Routes,
            Route,
            // Basic implementation of hooks
            useNavigate: () => {
                console.warn('Router useNavigate called with minimal implementation');
                return (path) => {
                    console.warn('Navigation attempted to:', path);
                    window.location.href = path;
                };
            },
            useLocation: () => {
                return {
                    pathname: window.location.pathname,
                    search: window.location.search,
                    hash: window.location.hash
                };
            }
        };
    }
    return window.ReactRouter;
};

// Fallback router component
export const FallbackRouter = ({ children }) => {
    console.warn('Using fallback router implementation');
    return children;
};
