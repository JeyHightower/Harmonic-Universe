/**
 * Browser utility functions
 */

// Store the page load timestamp
let pageLoadTimestamp = Date.now();

/**
 * Detects if the current page load is a hard refresh
 * Uses a simplified approach that works across browsers
 * @returns {boolean} True if the current page load is likely a hard refresh
 */
export const isHardRefresh = () => {
  // Modern browsers
  if (window.performance && window.performance.getEntriesByType) {
    const navigationEntries = window.performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      return navigationEntries[0].type === 'reload';
    }
  }

  // Legacy browsers and fallback
  // If we're within 3 seconds of page load, it's likely a fresh load or refresh
  const timeSinceLoad = Date.now() - pageLoadTimestamp;
  return timeSinceLoad < 3000;
};

/**
 * Resets the page load timestamp
 * Call this when you want to reset the refresh detection state
 */
export const resetPageLoadInfo = () => {
  pageLoadTimestamp = Date.now();
};

export default {
  isHardRefresh,
  resetPageLoadInfo,
}; 