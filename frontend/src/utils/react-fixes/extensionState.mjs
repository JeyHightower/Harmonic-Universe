/**
 * Browser extension state management
 * This file provides state management for browser extensions
 */

(function () {
  // Define global extensionState object if not already present
  window.extensionState = window.extensionState || {
    initialized: true,
    features: {},
    settings: {},

    getState: function () {
      return this;
    },

    getSetting: function (key, defaultValue) {
      return this.settings[key] || defaultValue;
    },

    setSetting: function (key, value) {
      this.settings[key] = value;
      return value;
    },

    resetState: function () {
      this.features = {};
      this.settings = {};
      return true;
    },
  };

  console.log('[Browser Extension Compatibility] Extension state loaded');
})();
