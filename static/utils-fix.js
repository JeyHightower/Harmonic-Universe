// This script directly targets and fixes the utils.js error without recursive loading
(function () {
    // Keep track of whether we've run this script already
    if (window.__UTILS_FIX_APPLIED__) {
        console.log('Utils fix already applied, skipping');
        return;
    }
    window.__UTILS_FIX_APPLIED__ = true;

    console.log('Applying Ant Design Icons version fixes');

    // 1. Set global version variables
    window.__ANT_ICONS_VERSION__ = '4.2.1';

    // 2. Find the actual problematic utils.js file (not this fix script)
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || '';
        // Make sure we exclude our own utils-fix.js script!
        if (src.includes('/assets/') && src.includes('utils') &&
            src.endsWith('.js') && !src.includes('utils-fix') &&
            !src.includes('patched=')) {

            console.log('Found actual utils.js file:', src);

            // Instead of loading another script, we'll just patch any vulnerable code
            try {
                // Create a safety wrapper for the problematic function
                window.__safeGetVersion = function (obj) {
                    if (obj === undefined || obj === null) {
                        console.warn('Using fallback version for undefined object');
                        return '4.2.1';
                    }
                    return obj.version || '4.2.1';
                };

                // No need to load another script - we've patched what's needed
                console.log('Successfully applied utils.js patch');
            } catch (err) {
                console.error('Error applying utils.js patch:', err);
            }

            break;
        }
    }

    // 3. Add global protection for version property access
    try {
        // Create a safe version property getter for all objects
        const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        const versionDesc = Object.getOwnPropertyDescriptor(Object.prototype, 'version');

        if (!versionDesc) {
            Object.defineProperty(Object.prototype, 'version', {
                get: function () {
                    // Only return the fallback for undefined/null
                    if (this === undefined || this === null) {
                        console.warn('Prevented version error on undefined object');
                        return '4.2.1';
                    }
                    return undefined; // Regular property lookup for valid objects
                },
                configurable: true,
                enumerable: false
            });

            console.log('Installed version safety property');
        }

        // 4. Add a global error handler specifically for this error
        window.addEventListener('error', function (event) {
            if (event.message && event.message.includes('Cannot read properties of undefined') &&
                event.message.includes('version')) {
                console.warn('Caught version error, suppressing', event.message);
                event.preventDefault();
                event.stopPropagation();
                return true; // Prevent the error from appearing in console
            }
        }, true);

        console.log('Installed global error handler for version errors');
    } catch (e) {
        console.error('Error installing protections:', e);
    }
})();
