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

// Import these specific exports directly instead of using require
import {
    getTwoToneColor,
    setTwoToneColor,
    createFromIconfontCN
} from '@ant-design/icons';

// This is a special handler that intercepts dynamic imports
// It returns the proper icon from the official implementation
export function resolveIcon(iconName) {
    try {
        // Use the imported icons instead of requiring them
        // Get the icon from the already imported icons
        const icons = import.meta.glob('@ant-design/icons');

        // Return the requested icon or a placeholder
        return icons[iconName] || (() => null);
    } catch (error) {
        console.error(`Error resolving icon ${iconName}:`, error);
        return () => null;
    }
}

// Export these methods for backwards compatibility
export { getTwoToneColor, setTwoToneColor, createFromIconfontCN };
