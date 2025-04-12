/**
 * Safe dynamic import utility for browser environments
 * This replaces require() calls with proper dynamic imports
 */
import React from 'react';

// Cache for imports to avoid duplicate network requests
const importCache = {};

/**
 * Safely import a module in browser environment
 * @param {string} path - Path to module
 * @returns {Promise} - Promise resolving to the module
 */
export async function safeImport(path) {
  try {
    // Check cache first
    if (importCache[path]) {
      return importCache[path];
    }

    // Use dynamic import() which works in browsers
    const module = await import(/* @vite-ignore */ path);
    importCache[path] = module;
    return module;
  } catch (error) {
    console.error(`[Import Error] Failed to import ${path}:`, error);
    return { default: null };
  }
}

/**
 * Synchronous wrapper for dynamic imports
 * Note: This doesn't actually work synchronously, but provides a fallback
 * that can be used in place of require() statements
 * @param {string} path - Path to module
 * @returns {Object} - Object with a default property containing a placeholder
 */
export function requireShim(path) {
  console.warn(
    `[Import Warning] Using requireShim for ${path} - this is not a true synchronous import`
  );

  // Start the import in the background
  safeImport(path).then((module) => {
    // Update the cache when it completes
    importCache[path] = module;
  });

  // Return default fallback
  return {
    default: () => null,
    __isShim: true,
  };
}

/**
 * Dynamically load a React component
 * @param {string} path - Path to component
 * @param {Object} options - Loading options (fallback, errorComponent)
 * @returns {React.Component} - Dynamically loaded component
 */
export const loadComponent = (path, options = {}) => {
  // Use React.lazy for dynamic imports
  const LazyComponent = React.lazy(async () => {
    try {
      const module = await safeImport(path);
      if (!module.default) {
        throw new Error(`Component at ${path} does not have a default export`);
      }
      return module;
    } catch (error) {
      console.error(`[Component Load Error] Failed to load ${path}:`, error);
      // Return a simple component that shows the error
      if (options.errorComponent) {
        return { default: options.errorComponent };
      }
      return { 
        default: () => React.createElement('div', { 
          style: { color: 'red', padding: '10px', border: '1px solid red' } 
        }, `Failed to load component: ${path}`) 
      };
    }
  });

  // Return a component that handles suspense
  const DynamicComponent = (props) => {
    const Fallback = options.fallback || (() => React.createElement('div', null, 'Loading...'));
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(Fallback) },
      React.createElement(LazyComponent, props)
    );
  };

  // Add displayName for debugging and to fix ESLint warning
  const componentName = path.split('/').pop().replace(/\.\w+$/, '');
  DynamicComponent.displayName = `DynamicComponent(${componentName})`;

  return DynamicComponent;
};

// Provide a global shim for require if it doesn't exist
if (typeof window !== "undefined" && typeof window.require === "undefined") {
  window.require = function (path) {
    console.warn(`[Global Require] Using require shim for ${path}`);
    return requireShim(path);
  };

  // Also make the safe import functions available globally
  window.safeImport = safeImport;
  window.requireShim = requireShim;
}

window.__DYNAMIC_IMPORT_LOADED = true;
console.log("[Dynamic Import] Shim loaded successfully");

// Export for module usage
export default {
  safeImport,
  requireShim,
  loadComponent
};
