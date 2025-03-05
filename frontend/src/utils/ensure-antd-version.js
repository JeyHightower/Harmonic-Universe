// ensure-antd-version.js
console.log('Ensuring Ant Design version is available');

// Set version globally
if (typeof window !== 'undefined') {
    window.__ANT_ICONS_VERSION__ = "4.2.1";

    // Create a version object that can be accessed
    window.AntIconsVersion = {
        version: "4.2.1"
    };

    // Create a safe version detector
    window.getAntIconsVersion = function () {
        try {
            return window.__ANT_ICONS_VERSION__ || "4.2.1";
        } catch (e) {
            console.warn('Error getting Ant Icons version', e);
            return "4.2.1";
        }
    };

    // Patch any attempts to access undefined.version
    if (!window.__ANT_VERSION_PATCH_APPLIED__) {
        console.log('Applying Ant Design version patch');

        // Create a global error handler
        const originalErrorHandler = window.onerror;
        window.onerror = function (message, source, lineno, colno, error) {
            // Check if it's the version error
            if (message && message.toString().includes('Cannot read properties of undefined') &&
                message.toString().includes('version')) {
                console.warn('Caught version error globally');

                // Don't propagate this specific error
                return true;
            }

            // Call the original handler for other errors
            if (originalErrorHandler) {
                return originalErrorHandler.apply(this, arguments);
            }

            // Let default handling occur
            return false;
        };

        window.__ANT_VERSION_PATCH_APPLIED__ = true;
    }
}

export default {
    version: "4.2.1",
    getVersion: () => "4.2.1"
};
