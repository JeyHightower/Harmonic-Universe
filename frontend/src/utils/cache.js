/**
 * Simple in-memory cache implementation
 */
class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * @param {string} key - The cache key
   * @returns {*} The cached value or undefined if not found
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   * @param {number} [ttl] - Time to live in milliseconds
   */
  set(key, value, ttl) {
    const item = {
      value,
      expiry: ttl ? Date.now() + ttl : undefined,
    };
    this.cache.set(key, item);
  }

  /**
   * Clear a specific key from the cache
   * @param {string} key - The cache key to clear
   */
  clear(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clearAll() {
    this.cache.clear();
  }
}

export const cache = new Cache();
