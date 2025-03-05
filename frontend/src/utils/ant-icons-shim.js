/**
 * This file provides a minimal shim for Ant Design icons SVG modules
 * It ensures all version properties are available for the icons library
 */

// Create a version property that ant-design/icons expects
export const version = '4.2.1';

// Define all namespaces that might be accessed
export const asn = { version };
export const lib = { version, asn: { version } };
export const es = { version, asn: { version } };

// Basic icon generator
const createGenericIcon = (iconName = 'default-icon') => {
    return {
        name: iconName,
        theme: 'outlined',
        icon: {
            tag: 'svg',
            attrs: {
                viewBox: '64 64 896 896',
                focusable: 'false',
                'data-icon': iconName,
                width: '1em',
                height: '1em',
                fill: 'currentColor'
            },
            children: [{
                tag: 'path',
                attrs: { d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z' }
            }]
        }
    };
};

// Export a function to get any icon
export function getIcon(iconName) {
    return createGenericIcon(iconName);
}

// Default export that provides everything needed
export default {
    version,
    asn,
    lib,
    es,
    getIcon
};
