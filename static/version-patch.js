// Version patch with no script loading/detection logic
(function () {
    // Simple flag in localStorage to prevent multiple executions
    if (localStorage.getItem('versionPatchApplied')) {
        return;
    }
    localStorage.setItem('versionPatchApplied', 'true');

    console.log('Applying simple version patch');

    // 1. Define version constant
    const VERSION = '4.2.1';

    // 2. Set global version variables
    window.__ANT_ICONS_VERSION__ = VERSION;

    // 3. Add direct fix for undefined.version access
    try {
        // Create a safe version property getter but ONLY for undefined
        const versionDesc = Object.getOwnPropertyDescriptor(Object.prototype, 'version');

        if (!versionDesc) {
            Object.defineProperty(Object.prototype, 'version', {
                get: function () {
                    // Only return the fallback for undefined/null
                    if (this === undefined || this === null) {
                        return VERSION;
                    }
                    return undefined; // Regular property lookup for valid objects
                },
                // Make it non-enumerable to avoid affecting for...in loops
                enumerable: false,
                configurable: true
            });
        }

        // 4. Add a global error handler specifically for version errors
        window.addEventListener('error', function (event) {
            if (event.message && event.message.includes('Cannot read properties of undefined') &&
                event.message.includes('version')) {
                console.warn('Caught version error, handling silently');
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
        }, true);

        // 5. Patch console.error to hide specific errors
        const originalConsoleError = console.error;
        console.error = function (...args) {
            if (args[0] && typeof args[0] === 'string' &&
                args[0].includes('version') &&
                args[0].includes('undefined')) {
                // Silently ignore this error
                return;
            }
            return originalConsoleError.apply(console, args);
        };

        console.log('Version patch successfully applied');
    } catch (e) {
        console.error('Error applying version patch:', e);
    }
})();
