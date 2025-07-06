/**
 * Browser extension heuristics redefinitions
 * This file provides compatibility for browser extensions that use heuristics
 */

(function () {
  // Define global heuristicsRedefinitions object if not already present
  window.heuristicsRedefinitions = window.heuristicsRedefinitions || {
    enabled: true,
    registry: {},

    register: function (name, definition) {
      this.registry[name] = definition;
      return null;
    },

    get: function (name) {
      return this.registry[name] || null;
    },

    disable: function () {
      this.enabled = false;
      return true;
    },

    enable: function () {
      this.enabled = true;
      return true;
    },
  };

  console.log('[Browser Extension Compatibility] Heuristics redefinitions loaded');
})();
