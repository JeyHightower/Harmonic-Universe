// Global fallbacks for Ant Design Icons
const version = "4.2.1";

// Export standalone version
export { version };

// Attach to window for global access
if (typeof window !== 'undefined') {
    window.__ANT_ICONS_VERSION__ = version;

    // Create a global IconProvider if it doesn't exist
    if (!window.IconProvider) {
        window.IconProvider = { version };
    } else if (!window.IconProvider.version) {
        window.IconProvider.version = version;
    }
}

// Export an empty provider that has a version
export const IconProvider = { version };

// Fallback for any undefined.version issues
const handler = {
    get: function (target, prop) {
        if (prop === 'version') return version;
        return target[prop];
    }
};

// Create a proxy for any undefined object
export function getIconObject(obj) {
    return obj ? obj : new Proxy({}, handler);
}
