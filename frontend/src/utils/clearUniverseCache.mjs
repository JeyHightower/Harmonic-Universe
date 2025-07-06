/**
 * Utility to clear cached universe IDs and help with universe access issues
 */

export const clearUniverseCache = () => {
  console.log('=== CLEARING UNIVERSE CACHE ===');

  // Clear any cached universe IDs
  localStorage.removeItem('lastViewedUniverseId');

  // Clear any other potential universe-related cache
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('universe') || key.includes('scene'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    console.log(`Removing cached key: ${key}`);
    localStorage.removeItem(key);
  });

  console.log('Universe cache cleared successfully');
  console.log('=== UNIVERSE CACHE CLEARED ===');
};

export const checkUniverseCache = () => {
  console.log('=== CHECKING UNIVERSE CACHE ===');

  const lastViewedUniverseId = localStorage.getItem('lastViewedUniverseId');
  console.log('lastViewedUniverseId:', lastViewedUniverseId);

  // Check for any other universe-related keys
  const universeKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('universe') || key.includes('scene'))) {
      universeKeys.push(key);
    }
  }

  console.log('Other universe-related keys:', universeKeys);
  console.log('=== UNIVERSE CACHE CHECK COMPLETE ===');

  return {
    lastViewedUniverseId,
    universeKeys,
  };
};

// Make functions available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.clearUniverseCache = clearUniverseCache;
  window.checkUniverseCache = checkUniverseCache;

  console.log('Universe cache utilities available:');
  console.log('- window.clearUniverseCache()');
  console.log('- window.checkUniverseCache()');
}
