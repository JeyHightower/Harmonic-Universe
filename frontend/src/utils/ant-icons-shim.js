/**
 * This file provides a simple shim for Ant Design icons
 * It's kept for compatibility but no longer needed for most icons
 * since they're handled by the Vite plugin
 */

// Create a simple object for a generic icon
const createGenericIcon = (iconName) => {
    const theme = iconName.includes('Filled') ? 'filled' :
        iconName.includes('Outlined') ? 'outlined' : 'outlined';

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
                    'data-icon': iconName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase(),
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
        }
    };
};

// Export a function to get any icon
export function getIcon(iconName) {
    return createGenericIcon(iconName);
}

// Export ES module flag
export const __esModule = true;

// Export default proxy for compatibility
export default { getIcon };
