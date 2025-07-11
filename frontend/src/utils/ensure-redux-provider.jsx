import { useDispatch } from 'react-redux';
import React from 'react';
import { Provider } from 'react-redux';

// Safe wrapper for useDispatch hook
export function useSafeDispatch() {
  try {
    return useDispatch();
  } catch (error) {
    console.error('[ensure-redux-provider] Error using useDispatch:', error);
    // Return a no-op dispatch function as fallback
    return () => {
      console.warn('[ensure-redux-provider] Dispatch called without Redux Provider');
      return { type: 'NO_OP' };
    };
  }
}

// For backward compatibility
export const safeUseDispatch = useSafeDispatch;

/**
 * Ensures a component is wrapped in a Redux Provider
 * Useful for components that need to use Redux outside the main app structure
 *
 * @param {React.Component} Component - The component to wrap
 * @param {Object} store - The Redux store
 * @returns {React.Component} - The wrapped component
 */
export const ensureReduxProvider = (Component, store) => {
  // Return a new component that wraps the provided component with Redux Provider
  const WrappedWithReduxProvider = (props) => {
    if (!store) {
      console.error('[ensure-redux-provider] No store provided!');
      return <Component {...props} />;
    }

    return (
      <Provider store={store}>
        <Component {...props} />
      </Provider>
    );
  };

  // Add displayName for debugging and to fix ESLint warning
  const wrappedComponentName = Component.displayName || Component.name || 'Component';
  WrappedWithReduxProvider.displayName = `EnsureReduxProvider(${wrappedComponentName})`;

  return WrappedWithReduxProvider;
};
