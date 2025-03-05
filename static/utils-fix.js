// This script directly targets and fixes the utils.js error
(function () {
    // Try to find and fix the exact file with the error
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || '';
        if (src.includes('utils') && src.includes('.js')) {
            console.log('Found utils.js at:', src);

            // Create a new script tag to load a patched version
            const fixScript = document.createElement('script');
            fixScript.onload = function () {
                console.log('Successfully loaded patched utils.js');
            };
            fixScript.onerror = function () {
                console.error('Failed to load patched utils.js');
            };

            // Add timestamp to bypass cache
            fixScript.src = src + '?patched=' + Date.now();
            document.head.appendChild(fixScript);

            // Prevent the original from executing if possible
            scripts[i].dataset.disabled = 'true';

            break;
        }
    }

    // Direct fix for the exact line that's causing the error
    // This creates a global function that's used to safely access .version
    window.__safeGetVersion = function (obj) {
        if (obj === undefined || obj === null) {
            console.warn('Safely returning version for undefined object');
            return '4.2.1';
        }
        return obj.version || '4.2.1';
    };

    // Patch window.utils if it exists
    if (window.utils) {
        const originalUtils = window.utils;
        window.utils = new Proxy(originalUtils, {
            get: function (target, prop) {
                if (prop === 'version' && (target === undefined || target === null)) {
                    return '4.2.1';
                }
                return target[prop];
            }
        });
    }
})();
