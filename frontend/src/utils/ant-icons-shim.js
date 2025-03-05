/**
 * This file provides a complete shim for Ant Design icons SVG modules
 * It ensures all necessary properties are available for the icons library
 */

// Create a version property that ant-design/icons expects
export const version = '4.2.1'; // Match a compatible version

// Create a simple object for a generic icon
const createGenericIcon = (iconName) => {
    const theme = iconName.includes('Filled') ? 'filled' :
        iconName.includes('Outlined') ? 'outlined' : 'outlined';

    const formattedName = iconName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();

    return {
        name: formattedName,
        theme: theme,
        icon: {
            tag: 'svg',
            attrs: {
                viewBox: '64 64 896 896',
                focusable: 'false',
                'data-icon': formattedName,
                width: '1em',
                height: '1em',
                fill: 'currentColor'
            },
            children: [{
                tag: 'path',
                attrs: {
                    d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z'
                }
            }]
        }
    };
};

// Export a function to get any icon
export function getIcon(iconName) {
    const icon = createGenericIcon(iconName);
    // Make sure it has all properties needed by @ant-design/icons
    return {
        ...icon,
        default: icon, // Some imports expect a default property
        __esModule: true
    };
}

// Add asn namespace for compatibility
export const asn = {
    version: version
};

// Add all required exports for compatibility
export default {
    version: version,
    getIcon: getIcon,
    asn: asn
};

// Mark as ES module
export const __esModule = true;
