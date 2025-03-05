// version-patch.js - Comprehensive fix for Ant Design Icons
(function() {
  // Only run once
  if (window.__ANT_ICONS_VERSION_PATCH_APPLIED__) return;
  window.__ANT_ICONS_VERSION_PATCH_APPLIED__ = true;

  console.log('Applying Ant Design Icons version patch');

  // Define the version
  window.__ANT_ICONS_VERSION__ = '5.6.1';

  // Create a safe version getter for undefined objects
  try {
    Object.defineProperty(Object.prototype, 'version', {
      get: function() {
        if (this === undefined || this === null) {
          return '5.6.1';
        }
        return undefined;
      },
      configurable: true,
      enumerable: false
    });

    // Add version to the window global
    window.version = '5.6.1';

    // Create backup modules
    window.__ant_icons_modules__ = window.__ant_icons_modules__ || {};
    window.__ant_icons_modules__.version = {
      version: '5.6.1',
      default: { version: '5.6.1' }
    };

    console.log('Ant Design Icons version patch applied successfully');
  } catch (e) {
    console.error('Error applying Ant Design Icons version patch:', e);
  }
})();
