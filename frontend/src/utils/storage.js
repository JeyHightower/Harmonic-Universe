const STORAGE_KEYS = {
  STORYBOARD_PREFERENCES: "storyboard_preferences",
  STORYBOARD_DRAFT: "storyboard_draft",
};

export const storage = {
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${error}`);
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage: ${error}`);
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage: ${error}`);
      return false;
    }
  },

  getStoryboardPreferences(universeId) {
    return this.getItem(`${STORAGE_KEYS.STORYBOARD_PREFERENCES}_${universeId}`);
  },

  setStoryboardPreferences(universeId, preferences) {
    return this.setItem(
      `${STORAGE_KEYS.STORYBOARD_PREFERENCES}_${universeId}`,
      preferences,
    );
  },

  getStoryboardDraft(universeId) {
    return this.getItem(`${STORAGE_KEYS.STORYBOARD_DRAFT}_${universeId}`);
  },

  setStoryboardDraft(universeId, draft) {
    return this.setItem(
      `${STORAGE_KEYS.STORYBOARD_DRAFT}_${universeId}`,
      draft,
    );
  },

  clearStoryboardDraft(universeId) {
    return this.removeItem(`${STORAGE_KEYS.STORYBOARD_DRAFT}_${universeId}`);
  },
};

export const STORAGE_DEFAULTS = {
  storyboardPreferences: {
    pagination: {
      perPage: 10,
    },
    sort: {
      field: "created_at",
      order: "desc",
    },
    filters: {
      search: "",
      harmonyMin: null,
      harmonyMax: null,
    },
  },
};
