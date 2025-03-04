/**
 * This file provides shim implementations for Ant Design icon SVGs
 * It creates a simple object structure that matches what the real icons would return
 * but without requiring the actual SVG paths/data
 */

// Shim for @ant-design/icons-svg/es/asn/* imports
// This provides fallback icon implementations to avoid build errors

// Cache for icons we've already created
const iconsCache = new Map();

// SVG icon creation function
export function createIconSvg(iconName) {
    let theme = 'outlined'; // default

    // Determine theme based on name
    if (iconName.includes('Filled')) {
        theme = 'filled';
    } else if (iconName.includes('TwoTone')) {
        theme = 'twotone';
    }

    return {
        name: iconName,
        theme,
        icon: {
            tag: 'svg',
            attrs: { viewBox: '64 64 896 896' },
            children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
        }
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

// List of icons that were causing errors - include all of them here
const additionalIcons = [
    'UsbFilled',
    'WalletTwoTone',
    'WeiboSquareFilled',
    'FileExcelFilled',
    'XFilled',
    'WalletFilled',
    'YahooOutlined',
    'LayoutTwoTone',
    'UploadOutlined',
    'HarmonyOSOutlined',
    'WifiOutlined',
    'LayoutFilled',
    'JavaOutlined',
    'JavaScriptOutlined',
    'VideoCameraFilled',
    'LaptopOutlined',
    'LayoutOutlined',
    'KeyOutlined',
    'ZhihuOutlined',
    'LoadingOutlined',
    'CheckOutlined',
    'CloseOutlined',
    'HolderOutlined',
    'SearchOutlined',
    'PlusOutlined',
    'EditOutlined',
    'DeleteOutlined',
    'InfoCircleOutlined',
    'ExclamationCircleOutlined',
    'DownOutlined',
    'RightOutlined',
    'LeftOutlined',
    'UpOutlined',
    'UserOutlined'
];

// Generate exports for all additional icons
additionalIcons.forEach(iconName => {
    exports[iconName] = getIcon(iconName);
});

// Special handler for module exports
// This allows directly importing from the shim as a directory
// E.g., import IconName from '@ant-design/icons-svg/es/asn/IconName'
export const handler = {
    get: function (target, prop) {
        if (prop in target) {
            return target[prop];
        }
        // For any unknown icon, create it on demand
        return getIcon(prop);
    }
};

// Use a Proxy to handle any dynamic icon requests
export default new Proxy({}, handler);

// Add named exports for each problematic icon - this helps with ESM named imports
// These specific exports match the error messages shown in the bundler
export const UsbFilled = getIcon('UsbFilled');
export const WalletTwoTone = getIcon('WalletTwoTone');
export const WeiboSquareFilled = getIcon('WeiboSquareFilled');
export const FileExcelFilled = getIcon('FileExcelFilled');
export const XFilled = getIcon('XFilled');
export const WalletFilled = getIcon('WalletFilled');
export const YahooOutlined = getIcon('YahooOutlined');
export const LayoutTwoTone = getIcon('LayoutTwoTone');
export const UploadOutlined = getIcon('UploadOutlined');
export const HarmonyOSOutlined = getIcon('HarmonyOSOutlined');
export const WifiOutlined = getIcon('WifiOutlined');
export const LayoutFilled = getIcon('LayoutFilled');
export const JavaOutlined = getIcon('JavaOutlined');
export const JavaScriptOutlined = getIcon('JavaScriptOutlined');
export const VideoCameraFilled = getIcon('VideoCameraFilled');
export const LaptopOutlined = getIcon('LaptopOutlined');
export const LayoutOutlined = getIcon('LayoutOutlined');
export const KeyOutlined = getIcon('KeyOutlined');
export const ZhihuOutlined = getIcon('ZhihuOutlined');
