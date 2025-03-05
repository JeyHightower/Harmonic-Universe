/**
 * This script creates a React fallback module to ensure React dependencies
 * are available in built files, especially for Ant Design icons.
 */

import fs from 'fs';
import path from 'path';

// Create the dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Create the assets directory if it doesn't exist
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Create the fallback file
const fallbackFile = path.join(assetsDir, 'react-fallback.js');

// Create React fallback content
const fallbackContent = `
// This is a fallback module for React dependencies
// It provides mock implementations for React functions used by Ant Design icons

window.React = window.React || {
  createContext: function(defaultValue) {
    const context = {
      Provider: function Provider({ value, children }) {
        return children || null;
      },
      Consumer: function Consumer({ children }) {
        return children ? children(defaultValue) : null;
      },
      displayName: 'MockContext',
      _currentValue: defaultValue,
      _currentValue2: defaultValue
    };
    return context;
  },
  createElement: function(type, props, ...children) {
    return { type, props, children };
  },
  isValidElement: function(object) {
    return object && typeof object === 'object' && 'type' in object;
  },
  Fragment: Symbol('Fragment'),
  memo: function(component) {
    return component;
  },
  forwardRef: function(component) {
    return component;
  }
};

// Define IconContext if missing
window.IconContext = window.IconContext || window.React.createContext({
  prefixCls: 'anticon',
  rtl: false
});

// Ensure window.version is defined for Ant icons
window.version = window.version || "4.2.1";

// Provide fallback for IconProvider (commonly used in Ant Design icons)
window.IconProvider = window.IconProvider || {
  version: "4.2.1",
  Provider: function() {},
  Consumer: function() {}
};

// Export as ES modules
export const createContext = window.React.createContext;
export const createElement = window.React.createElement;
export const isValidElement = window.React.isValidElement;
export const Fragment = window.React.Fragment;
export const memo = window.React.memo;
export const forwardRef = window.React.forwardRef;
export const IconContext = window.IconContext;
export const IconProvider = window.IconProvider;
export const version = "4.2.1";

// Log that the fallback was loaded
console.log("[React Fallback] Mock React components loaded");
`;

// Write the fallback file
fs.writeFileSync(fallbackFile, fallbackContent);

console.log(`✅ Created React fallback file at: ${fallbackFile}`);

// Create an HTML snippet to include the fallback script
const htmlSnippet = `
<!-- Include this in your HTML before other scripts -->
<script src="/assets/react-fallback.js"></script>
`;

// Write the HTML snippet to a file for reference
const snippetFile = path.join(process.cwd(), 'frontend/scripts/react-fallback-snippet.html');
fs.writeFileSync(snippetFile, htmlSnippet);

console.log(`✅ Created HTML snippet at: ${snippetFile}`);
console.log('React fallback setup complete.');
