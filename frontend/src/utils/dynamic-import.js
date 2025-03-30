/**
 * Safe dynamic import utility for browser environments
 * This replaces require() calls with proper dynamic imports
 */

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
};
