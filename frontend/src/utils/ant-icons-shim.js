/**
 * This file provides universal shim implementations for Ant Design icon SVGs
 * It dynamically creates standardized objects for any requested icon
 * without requiring the actual SVG paths/data
 */

// Cache for icons we've already created
const iconsCache = new Map();

// Icon category patterns for better SVG paths
const ICON_CATEGORIES = {
    FILE: /^File/,
    ENVELOPE: /Envelope/,
    REDDIT: /Reddit/,
    REST: /^Rest/,
    REDO: /^Redo/,
    SOCIAL: /Circle|Square|(OutlinedSocial)$/,
};

// SVG paths for different icon categories
const SVG_PATHS = {
    FILE: 'M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326z',
    ENVELOPE: 'M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6c26.7 20.8 64.9 20.8 91.6 0L906.3 270.8l27.6-21.5-39.3-50.5-61 47.2z',
    SOCIAL: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-90.7 477.8l178.5 178.5c-3.8 6.5-10.4 10.9-18.2 10.9H329.1c-7.9 0-14.5-4.4-18.3-10.9l178.5-178.5z',
    DEFAULT: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z'
};

// Get the appropriate SVG path for an icon based on its name
function getSvgPathForIcon(iconName) {
    // Check each category pattern
    for (const [category, pattern] of Object.entries(ICON_CATEGORIES)) {
        if (pattern.test(iconName)) {
            return SVG_PATHS[category] || SVG_PATHS.DEFAULT;
        }
    }
    return SVG_PATHS.DEFAULT;
}

// SVG icon creation function with improved structure
export function createIconSvg(iconName) {
    // Determine theme based on name
    let theme = 'outlined'; // default
    if (iconName.includes('Filled')) {
        theme = 'filled';
    } else if (iconName.includes('TwoTone')) {
        theme = 'twotone';
    }

    // Base name for data-icon attribute (remove theme suffixes)
    const baseIconName = iconName
        .replace(/filled|outlined|twotone/i, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');

    // Get the appropriate SVG path for this icon type
    const svgPath = getSvgPathForIcon(iconName);

    // Return a complete icon object with the structure Ant Design expects
    return {
        __esModule: true,
        default: {
            name: iconName,
            theme,
            icon: {
                tag: 'svg',
                attrs: {
                    viewBox: '64 64 896 896',
                    focusable: 'false',
                    'data-icon': baseIconName,
                    width: '1em',
                    height: '1em',
                    fill: 'currentColor',
                    'aria-hidden': 'true'
                },
                children: [{
                    tag: 'path',
                    attrs: {
                        d: svgPath,
                        fill: theme === 'twotone' ? '#E6E6E6' : 'currentColor'
                    }
                }]
            }
        },
        [Symbol.toStringTag]: 'Module'
    };
}

// Get an icon from cache or create it
function getIconSvg(iconName) {
    if (!iconsCache.has(iconName)) {
        iconsCache.set(iconName, createIconSvg(iconName));
    }
    return iconsCache.get(iconName);
}

// Export a function to dynamically get any icon
export function getIcon(iconName) {
    return getIconSvg(iconName);
}

// Export ES module flag for better compatibility
export const __esModule = true;

// Special handler for module exports to create icons on demand
export const handler = {
    get: function (target, prop) {
        // Handle special properties
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        if (prop === 'then' || prop === 'catch') return undefined; // Handle promise checking

        // For any icon name, create it on demand
        return getIcon(prop);
    }
};

// Use a Proxy to handle any dynamic icon requests
// This ensures that any icon requested will be provided, even if not explicitly defined
const exportProxy = new Proxy({}, handler);

// Export default should be the proxy itself
export default exportProxy;
