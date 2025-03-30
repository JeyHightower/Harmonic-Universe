// Special plugin to fix Ant Design Icons version issues
export default function antIconsFix() {
    let isBuild = false;

    return {
        name: 'ant-icons-version-fix',

        configResolved(config) {
            isBuild = config.command === 'build';
            console.log(`[AntIconsFix] Running in ${isBuild ? 'build' : 'development'} mode`);
        },

        transform(code, id) {
            if ((id.includes('ant-icons') || id.includes('@ant-design/icons')) &&
                !code.includes('export { version }')) {
                console.log('[AntIconsFix] Adding version to:', id);

                const injection = `
// Injected version property for Ant Design Icons
const version = "5.6.1";
export { version };
if (typeof window !== 'undefined') {
  window.__ANT_ICONS_VERSION__ = version;
}

// Ensure IconProvider has access to version
if (typeof IconProvider !== 'undefined' && !IconProvider.version) {
  IconProvider.version = version;
}

// Add error handling for icon rendering
if (typeof window !== 'undefined' && !window.__ANT_ICONS_ERROR_HANDLER__) {
  window.__ANT_ICONS_ERROR_HANDLER__ = true;
  window.addEventListener('error', function(event) {
    // Check if error is related to Ant Icons
    if (event && event.error && event.error.message &&
        (event.error.message.includes('ant-design/icons') ||
         event.error.message.includes('version'))) {
      console.warn('[AntIconsFix] Caught Ant Icons error:', event.error.message);
      event.preventDefault();

      // Set a flag to indicate an error occurred
      window.__ANT_ICONS_ERROR_OCCURRED__ = true;
    }
  });
}
        `;

                return {
                    code: injection + code,
                    map: null
                };
            }

            return null;
        }
    };
}
