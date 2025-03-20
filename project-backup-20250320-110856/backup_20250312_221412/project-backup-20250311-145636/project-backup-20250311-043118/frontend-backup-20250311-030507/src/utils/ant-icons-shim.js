// Ant Design Icons shim
import * as AntdIcons from '@ant-design/icons';
import { createFromIconfontCN } from '@ant-design/icons';

// Create a version object if it doesn't exist
if (!window.__ANT_ICONS_VERSION) {
    window.__ANT_ICONS_VERSION = {
        version: '5.6.1',
        prefix: 'anticon'
    };
}

// Create a registry for icons
if (!window.__ANT_ICONS_REGISTRY) {
    window.__ANT_ICONS_REGISTRY = new Map();
}

// Register all icons
Object.entries(AntdIcons).forEach(([name, component]) => {
    if (name.match(/^[A-Z]/) && typeof component === 'object') {
        window.__ANT_ICONS_REGISTRY.set(name, component);
    }
});

// Create a helper to get icons
window.getAntIcon = function (name) {
    return window.__ANT_ICONS_REGISTRY.get(name);
};

// Export for module usage
export const IconRegistry = window.__ANT_ICONS_REGISTRY;
export const getIcon = window.getAntIcon;
export const version = window.__ANT_ICONS_VERSION;

// Create a registry for custom icons
const iconRegistry = new Map();

// Function to register custom icons
export function registerIcon(iconName, component) {
    if (!iconRegistry.has(iconName)) {
        iconRegistry.set(iconName, component);
    }
}

// Function to get registered icon
export function getIcon(iconName) {
    return iconRegistry.get(iconName) || AntdIcons[iconName];
}

// Create IconFont instance for custom font icons
export const IconFont = createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js',
});

// Export all Antd icons
export * from '@ant-design/icons';

// Export helper functions
export const isIconName = (name) => {
    return typeof name === 'string' && (
        iconRegistry.has(name) ||
        name in AntdIcons
    );
};

export const getIconComponent = (name) => {
    if (!isIconName(name)) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }
    return getIcon(name);
};
