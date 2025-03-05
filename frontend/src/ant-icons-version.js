/**
 * Direct version export for Ant Design Icons
 * This file provides a reliable version number for Ant Design Icons
 * It can be imported directly by components that need it
 */

// Version constant
export const version = "4.2.1";

// Default export for CommonJS compatibility
export default { version };

// Apply to window for global access
if (typeof window !== 'undefined') {
    window.__ANT_ICONS_VERSION__ = version;
}

// Log that this file was loaded
console.log('[ant-icons-version] Version module loaded successfully');
