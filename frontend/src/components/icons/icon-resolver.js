/**
 * Icon resolver utility
 * This provides a way to intercept and handle missing Ant Design icon imports
 */

import * as shimIcons from './ant-icons-shim';

// Map of icon names to their components
const iconMap = new Map();

// Initialize the map with all exported icons from the shim
Object.keys(shimIcons).forEach((key) => {
  // Skip non-icon exports
  if (
    key !== '__esModule' &&
    key !== 'default' &&
    key !== 'handler' &&
    key !== 'getIcon' &&
    key !== 'createIconSvg'
  ) {
    iconMap.set(key, shimIcons[key]);
  }
});

/**
 * Get an icon by name
 * @param {string} iconName - The name of the icon to retrieve
 * @returns {Object} The icon object
 */
export function getIconByName(iconName) {
  // First check if we have this icon in our map
  if (iconMap.has(iconName)) {
    return iconMap.get(iconName);
  }

  // If not, create it on demand using the shim's getIcon function
  const icon = shimIcons.getIcon(iconName);
  iconMap.set(iconName, icon);
  return icon;
}

/**
 * Resolve an icon path to its component
 * @param {string} path - The import path
 * @returns {Object|null} The resolved icon or null
 */
export function resolveIconPath(path) {
  // Extract icon name from path like "@ant-design/icons-svg/es/asn/IconName"
  if (path.includes('@ant-design/icons-svg/es/asn/')) {
    const iconName = path.split('/').pop();
    return getIconByName(iconName);
  }
  return null;
}

// Export the shimIcons for direct access
export { shimIcons };

// Default export is the resolver
export default {
  getIconByName,
  resolveIconPath,
};
