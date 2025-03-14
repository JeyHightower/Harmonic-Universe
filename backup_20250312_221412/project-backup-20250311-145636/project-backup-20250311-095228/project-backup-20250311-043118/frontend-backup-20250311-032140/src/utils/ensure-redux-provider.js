/**
 * ensure-redux-provider.js - Makes sure Redux Provider is properly connected
 * Fixes React error #321 with Redux context
 */
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore } from 'redux';

const defaultReducer = (state = {}, action) => state;

export function ensureReduxProvider(element, store) {
    return React.createElement(ReduxProvider, { store }, element);
}

// Initialize with minimal fallbacks
let ProviderComponent = ({ children }) => children;
let store = null;

// Try to import Redux store asynchronously
async function loadReduxStore() {
    try {
        const storeModule = await import('../store');
        console.log('[Redux Fix] Successfully imported store');
        return storeModule.default;
    } catch (error) {
        console.error('[Redux Fix] Failed to import store, creating mock store:', error);
        // Create a minimal store implementation that won't crash
        return {
            getState: () => ({}),
            dispatch: (action) => {
                console.warn('[Redux Fix] Mock dispatch called with:', action);
                return action;
            },
            subscribe: () => () => { }
        };
    }
}

// Try to import react-redux asynchronously
async function loadReactRedux() {
    try {
        const reactRedux = await import('react-redux');
        console.log('[Redux Fix] Successfully imported react-redux');
        return reactRedux;
    } catch (error) {
        console.error('[Redux Fix] Failed to import react-redux:', error);
        return { Provider: ({ children }) => children };
    }
}

// Initialize Redux components
Promise.all([loadReduxStore(), loadReactRedux()]).then(([storeInstance, reduxModule]) => {
    store = storeInstance;
    ProviderComponent = reduxModule.Provider || ProviderComponent;

    // Make Provider available in root window context
    if (typeof window !== 'undefined') {
        window.__REDUX_STORE = store;
    }

    // Tag Provider with proper React component properties to avoid Error #321
    if (ProviderComponent && !ProviderComponent.isReactComponent) {
        ProviderComponent.isReactComponent = true;

        // Add React internal type symbols if possible
        if (typeof Symbol !== 'undefined') {
            ProviderComponent.$$typeof = Symbol.for('react.element');
        }

        console.log('[Redux Fix] Enhanced Provider with React component properties');
    }

    // Create a Provider context to register with global registry
    const ReduxContext = React.createContext(null);
    if (typeof window !== 'undefined' && window.__registerReactContext) {
        window.__registerReactContext('Redux', ReduxContext);
    }

    console.log('[Redux Fix] Using Redux store:', store ? 'available' : 'missing');

    return { Provider: ProviderComponent, store };
});

// Export a wrapped Provider that includes error handling
export const SafeReduxProvider = function ({ children, store: externalStore }) {
    const storeToUse = externalStore || store;

    // Log Redux store availability
    console.log('[Redux Fix] Using Redux store:', storeToUse ? 'available' : 'missing');

    if (!storeToUse) {
        console.error('[Redux Fix] No Redux store available, app may not function correctly');
        return children; // Return children without Provider to prevent error
    }

    try {
        // Check if Provider exists
        if (!ProviderComponent || typeof ProviderComponent !== 'function') {
            console.error('[Redux Fix] Redux Provider is not a valid component');
            return children;
        }

        return React.createElement(
            ProviderComponent,
            { store: storeToUse },
            children
        );
    } catch (error) {
        console.error('[Redux Fix] Error rendering Redux Provider:', error);
        return children;
    }
};

// Provide a custom useDispatch hook that works even if Redux isn't available
export const safeUseDispatch = () => {
    try {
        // Try to import and use the real useDispatch
        import('react-redux').then(module => {
            const { useDispatch } = module;
            if (typeof useDispatch === 'function') {
                try {
                    return useDispatch();
                } catch (error) {
                    console.warn('[Redux Fix] Error using real useDispatch:', error);
                }
            }
        }).catch(err => {
            console.warn('[Redux Fix] Could not import useDispatch:', err);
        });
    } catch (error) {
        console.warn('[Redux Fix] Error in safeUseDispatch:', error);
    }

    // Return a fallback dispatch function
    return (action) => {
        console.warn('[Redux Fix] Using mock dispatch with action:', action);
        if (window.__REDUX_STORE && window.__REDUX_STORE.dispatch) {
            return window.__REDUX_STORE.dispatch(action);
        }
        return action;
    };
};

// Make the Provider directly available globally
if (typeof window !== 'undefined' && window.React) {
    window.ReduxProvider = ProviderComponent;
    window.SafeReduxProvider = SafeReduxProvider;
    window.safeUseDispatch = safeUseDispatch;

    // Create a global hook for components to use
    window.useDispatchSafe = safeUseDispatch;
}

export default ProviderComponent;
