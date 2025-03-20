/**
 * Icon resolver that handles all dynamic imports for Ant Design icons
 *
 * This is a special module that enables dynamic imports of the form:
 * import { SomeIcon } from '@ant-design/icons/es/icons/SomeIcon'
 *
 * It automatically re-exports from the official @ant-design/icons package
 */

// Re-export everything from the official Icons implementation
export * from '@ant-design/icons';
export { default } from '@ant-design/icons';

// This is a special handler that intercepts dynamic requires
// It catches paths like: @ant-design/icons/es/icons/EllipsisOutlined
// And returns the proper icon from the official implementation
export function resolveIcon(iconName) {
    // Import everything from the official Ant Design icons
    const icons = require('@ant-design/icons');

    // Return the requested icon or a placeholder
    return icons[iconName] || (() => null);
}

// These are already provided by the official package, but we'll
// export them here for backwards compatibility
export const { getTwoToneColor, setTwoToneColor, createFromIconfontCN } = require('@ant-design/icons');
