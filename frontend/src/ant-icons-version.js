/**
 * Direct version export for Ant Design Icons
 * This file provides a reliable version number for Ant Design Icons
 * It can be imported directly by components that need it
 */

// Version constant
export const version = "5.6.1"; // Updated to match the version in package.json

// Default export for CommonJS compatibility
export default { version };

// Apply to window for global access
if (typeof window !== 'undefined') {
    window.__ANT_ICONS_VERSION__ = version;

    // Add fallback for error recovery
    window.__ANT_ICONS_FALLBACK__ = true;

    // Create minimal fallback handlers
    if (!window.AntDesignIcons) {
        window.AntDesignIcons = {
            createFromIconfontCN: () => () => null,
            getTwoToneColor: () => '#1890ff',
            setTwoToneColor: () => { }
        };
    }
}

// Log that this file was loaded
console.log('[ant-icons-version] Version module loaded successfully');
