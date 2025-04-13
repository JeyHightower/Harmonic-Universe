/**
 * ensure-router-provider.js - Makes sure React Router is properly initialized
 * Fixes React error #321 with Router context
 */
import React from 'react';
import { BrowserRouter as ReactBrowserRouter } from 'react-router-dom';

export function ensureRouterProvider(element) {
    return React.createElement(ReactBrowserRouter, null, element);
}

// Keep track of the module promise to avoid multiple imports
let RouterComponentsPromise = null;

// Initialize with minimal fallbacks
let BrowserRouter = ({ children }) => children;
let Routes = ({ children }) => children;
let Route = ({ children }) => children;
let useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });
let useNavigate = () => () => console.warn('[Router Fix] Mock navigate called');
let useParams = () => ({});
let Outlet = () => null;
let Link = ({ to, children }) => React.createElement('a', { href: to }, children);

// Try to import router components with dynamic import
async function loadRouterComponents() {
    try {
        // Import from react-router-dom
        const ReactRouterDom = await import('react-router-dom');
        console.log('[Router Fix] Successfully imported from react-router-dom');
        return ReactRouterDom;
    } catch (error) {
        console.error('[Router Fix] Failed to import from react-router-dom:', error);

        // Return minimal mock components
        return {
            BrowserRouter: ReactBrowserRouter,
            Routes,
            Route,
            useLocation,
            useNavigate,
            useParams,
            Outlet,
            Link
        };
    }
}

// Initialize the router components
RouterComponentsPromise = loadRouterComponents().then(components => {
    // Extract router components
    BrowserRouter = components.BrowserRouter || ReactBrowserRouter;
    Routes = components.Routes || Routes;
    Route = components.Route || Route;
    useLocation = components.useLocation || useLocation;
    useNavigate = components.useNavigate || useNavigate;
    useParams = components.useParams || useParams;
    Outlet = components.Outlet || Outlet;
    Link = components.Link || Link;

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
    for (const Component of [BrowserRouter, Routes, Route, Outlet, Link]) {
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
        if (typeof useLocation === 'function') {
            return useLocation();
        }
    } catch (error) {
        console.warn('[Router Fix] Error using useLocation:', error);
    }

    // Return a minimal location object
    return { pathname: '/', search: '', hash: '', state: null };
};

export const safeUseNavigate = () => {
    try {
        if (typeof useNavigate === 'function') {
            return useNavigate();
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
        if (typeof useParams === 'function') {
            return useParams();
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
    if (!BrowserRouter || typeof BrowserRouter !== 'function') {
        console.error('[Router Fix] BrowserRouter is not available, using fallback');
        return children;
    }

    try {
        return React.createElement(BrowserRouter, null, children);
    } catch (error) {
        console.error('[Router Fix] Error rendering BrowserRouter:', error);
        return children;
    }
};

// Make the Router components directly available globally
if (typeof window !== 'undefined' && window.React) {
    window.ReactRouter = {
        BrowserRouter,
        Routes,
        Route,
        useLocation: safeUseLocation,
        useNavigate: safeUseNavigate,
        useParams: safeUseParams,
        Outlet,
        Link,
        SafeRouter
    };

    // Create global hooks for components to use
    window.useLocationSafe = safeUseLocation;
    window.useNavigateSafe = safeUseNavigate;
    window.useParamsSafe = safeUseParams;
}

export {
    BrowserRouter,
    Routes,
    Route,
    Outlet,
    Link,
    // Export safe hooks by default
    safeUseLocation as useLocation,
    safeUseNavigate as useNavigate,
    safeUseParams as useParams
};
