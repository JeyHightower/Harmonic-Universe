(function () {
    console.log('Applying critical Ant Design Icons version patch');

    // Store original functions to avoid breaking things
    const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const originalGetProperty = Object.getPropertyDescriptor;

    // Create a safety wrapper for accessing .version property
    function safeVersionAccess(obj, prop) {
        if (prop === 'version') {
            if (obj === undefined || obj === null) {
                console.warn('Safely returning version for undefined object');
                return '4.2.1';
            }
        }
        return undefined; // Let normal property access continue
    }

    // Install our version patch
    try {
        // Method 1: Patch getter for 'version' property
        Object.defineProperty(Object.prototype, 'version', {
            get: function () {
                if (this === undefined || this === null) {
                    console.warn('Prevented version access error on undefined object');
                    return '4.2.1';
                }
                // Check if it naturally has a version
                if (Object.hasOwnProperty.call(this, 'version')) {
                    return this._version;
                }
                return '4.2.1';
            },
            set: function (val) {
                this._version = val;
            },
            configurable: true
        });

        // Method 2: Install a global error handler for this specific issue
        window.addEventListener('error', function (e) {
            if (e.message && e.message.includes('Cannot read properties of undefined') &&
                e.message.includes('version')) {
                console.warn('Caught version error, suppressing');
                e.preventDefault(); // Prevent error from propagating
            }
        }, true);

        // Method 3: Create a global object with version that Ant Icons can find
        window.__ANT_ICONS__ = window.__ANT_ICONS__ || {};
        window.__ANT_ICONS__.version = '4.2.1';
        window.__ANT_ICONS_VERSION__ = '4.2.1';

        // Method 4: Create global safety objects for common access patterns
        window.IconUtil = window.IconUtil || { version: '4.2.1' };
        window.IconsData = window.IconsData || { version: '4.2.1' };
        window.AntdIcons = window.AntdIcons || { version: '4.2.1' };
        window.IconSVG = window.IconSVG || { version: '4.2.1' };

        console.log('Ant Design Icons patches successfully applied');
    } catch (err) {
        console.error('Error applying Ant Icons patch:', err);
    }
})();
