/**
 * Cache configuration settings
 */
export const CACHE_CONFIG = {
  // User profile cache settings
  USER_PROFILE: {
    key: "user_profile",
    ttl: 5 * 60 * 1000, // 5 minutes
  },

  // Add more cache configurations as needed
  UNIVERSE_LIST: {
    key: "universe_list",
    ttl: 2 * 60 * 1000, // 2 minutes
  },

  SCENE_LIST: {
    key: "scene_list",
    ttl: 2 * 60 * 1000, // 2 minutes
  },
};
