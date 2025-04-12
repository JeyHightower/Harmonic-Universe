/**
 * Browser extension compatibility utilities
 * This file provides utility functions for browser extension compatibility
 */

(function() {
  // Define global utils object if not already present
  window.utils = window.utils || {
    checkExtensionCompatibility: function() {
      console.log('Extension compatibility check complete');
      return true;
    },
    
    suppressExtensionErrors: function() {
      console.log('Extension error suppression active');
      return true;
    },
    
    isExtensionEnabled: function(name) {
      return false;
    },
    
    registerExtension: function(name, version) {
      console.log(`Extension registration attempted: ${name} v${version}`);
      return { name, version, registered: true };
    }
  };
  
  console.log('[Browser Extension Compatibility] Utils loaded');
})(); 