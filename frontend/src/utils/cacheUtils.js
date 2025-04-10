// Cache constants
export const CHARACTER_CACHE_KEY = "character_cache";
export const CHARACTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
export const SCENE_CACHE_KEY = "scene_cache";
export const SCENE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Get cached character data by ID
 * @param {string|number} characterId - Character ID to look up
 * @returns {Object|null} Character data or null if not found/expired
 */
export const getCachedCharacter = (characterId) => {
  try {
    const cacheString = localStorage.getItem(CHARACTER_CACHE_KEY);
    if (!cacheString) return null;

    const cache = JSON.parse(cacheString);
    const now = Date.now();

    // Check if we have this character in cache and it's not expired
    if (cache[characterId] && cache[characterId].expires > now) {
      console.log(`Using cached character data for id: ${characterId}`);
      return cache[characterId].data;
    }

    return null;
  } catch (error) {
    console.error("Error reading from character cache:", error);
    return null;
  }
};

/**
 * Cache character data with expiration
 * @param {string|number} characterId - Character ID to cache
 * @param {Object} data - Character data to cache
 */
export const cacheCharacter = (characterId, data) => {
  try {
    // Always cache character data regardless of environment
    const cacheString = localStorage.getItem(CHARACTER_CACHE_KEY);
    const cache = cacheString ? JSON.parse(cacheString) : {};

    // Add or update the character in cache with expiration
    cache[characterId] = {
      data,
      expires: Date.now() + CHARACTER_CACHE_TTL,
    };

    // Clean up expired entries
    Object.keys(cache).forEach((key) => {
      if (cache[key].expires < Date.now()) {
        delete cache[key];
      }
    });

    localStorage.setItem(CHARACTER_CACHE_KEY, JSON.stringify(cache));
    console.log(`Cached character data for id: ${characterId}`);
  } catch (error) {
    console.error("Error writing to character cache:", error);
  }
};

/**
 * Get cached scenes data by universe ID
 * @param {string|number} universeId - Universe ID to look up
 * @returns {Array|null} Scene data or null if not found/expired
 */
export const getCachedScenes = (universeId) => {
  try {
    const cacheString = localStorage.getItem(SCENE_CACHE_KEY);
    if (!cacheString) return null;

    const cache = JSON.parse(cacheString);
    const now = Date.now();

    // Check if we have scenes for this universe in cache and they're not expired
    if (cache[universeId] && cache[universeId].expires > now) {
      console.log(`Using cached scenes for universe id: ${universeId}`);
      return cache[universeId].data;
    }

    return null;
  } catch (error) {
    console.error("Error reading from scene cache:", error);
    return null;
  }
};

/**
 * Cache scenes data with expiration
 * @param {string|number} universeId - Universe ID to cache scenes for
 * @param {Array} scenesData - Scene data to cache
 */
export const cacheScenes = (universeId, scenesData) => {
  try {
    const cacheString = localStorage.getItem(SCENE_CACHE_KEY);
    const cache = cacheString ? JSON.parse(cacheString) : {};

    // Add or update the scenes in cache with expiration
    cache[universeId] = {
      data: scenesData,
      expires: Date.now() + SCENE_CACHE_TTL,
    };

    // Clean up expired entries
    Object.keys(cache).forEach((key) => {
      if (cache[key].expires < Date.now()) {
        delete cache[key];
      }
    });

    localStorage.setItem(SCENE_CACHE_KEY, JSON.stringify(cache));
    console.log(
      `Cached ${scenesData.length} scenes for universe id: ${universeId}`
    );
  } catch (error) {
    console.error("Error writing to scene cache:", error);
  }
};

/**
 * Clear all cached data for a specific cache key
 * @param {string} cacheKey - Cache key to clear
 */
export const clearCache = (cacheKey) => {
  try {
    localStorage.removeItem(cacheKey);
    console.log(`Cleared cache for: ${cacheKey}`);
  } catch (error) {
    console.error(`Error clearing cache for ${cacheKey}:`, error);
  }
};

/**
 * Clear all application caches
 */
export const clearAllCaches = () => {
  clearCache(CHARACTER_CACHE_KEY);
  clearCache(SCENE_CACHE_KEY);
}; 