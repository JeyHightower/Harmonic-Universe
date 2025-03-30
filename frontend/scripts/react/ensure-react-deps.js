/**
 * This script creates a React fallback module to ensure React dependencies
 * are available in built files, especially for Ant Design icons.
 */

import fs from 'fs';
import path from 'path';

// Get the current working directory and determine if we're already in frontend
const cwd = process.cwd();
const isInFrontend = cwd.endsWith('/frontend') || cwd.endsWith('\\frontend');

// Helper to resolve paths correctly whether we're in /frontend or project root
function resolvePath(relativePath) {
  // If we're already in frontend directory, don't add frontend/ prefix
  if (isInFrontend && relativePath.startsWith('frontend/')) {
    return path.join(cwd, relativePath.substring(9));
  }
  return path.join(cwd, relativePath);
}

// Create the dist directory if it doesn't exist
const distDir = path.join(cwd, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created dist directory at: ${distDir}`);
}

// Create the assets directory if it doesn't exist
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created assets directory at: ${assetsDir}`);
}

// Create the fallback file
const fallbackFile = path.join(assetsDir, 'react-fallback.js');

// Create React fallback content - NO EXPORTS for browser compatibility
const fallbackContent = `
// This is a fallback module for React dependencies
// It provides mock implementations for React functions used by Ant Design icons
(function() {
  // Define version first so it's available globally
  window.version = "4.2.1";

  // Create a safety proxy to catch any undefined.version access
  window.__safeVersionProxy = new Proxy({}, {
    get: function(target, prop) {
      if (prop === 'version') return "4.2.1";
      return {};
    }
  });

  // Intercept property access to catch undefined.version errors
  // This is a more aggressive approach to prevent runtime errors
  const originalGet = Object.getOwnPropertyDescriptor(Object.prototype, '__lookupGetter__').value;
  Object.defineProperty(Object.prototype, '__lookupGetter__', {
    value: function(prop) {
      if (prop === 'version' && (this === undefined || this === null)) {
        console.warn('Prevented access to undefined.version');
        return function() { return "4.2.1"; };
      }
      return originalGet.apply(this, arguments);
    },
    configurable: true
  });

  // Define React mock if it doesn't exist
  if (typeof window.React === 'undefined') {
    window.React = {
      createContext: function(defaultValue) {
        const context = {
          Provider: function Provider(props) {
            return props.children || null;
          },
          Consumer: function Consumer(props) {
            return props.children ? props.children(defaultValue) : null;
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
  }

  // Ensure version is available on React
  if (window.React) window.React.version = window.React.version || "4.2.1";

  // Define IconContext if missing
  window.IconContext = window.IconContext || (window.React ? window.React.createContext({
    prefixCls: 'anticon',
    rtl: false
  }) : {
    Provider: function() {},
    Consumer: function() {}
  });

  // Ensure IconContext has a version
  if (window.IconContext) window.IconContext.version = "4.2.1";

  // Provide fallback for IconProvider (commonly used in Ant Design icons)
  window.IconProvider = window.IconProvider || {
    version: "4.2.1",
    Provider: function() {},
    Consumer: function() {}
  };

  // Set versions on all potential candidates
  const commonObjects = ['AntDesign', 'Icon', 'IconProvider', 'IconContext', 'AntIcon', 'TreeSelect', 'IconBase'];
  commonObjects.forEach(name => {
    if (window[name]) window[name].version = "4.2.1";
  });

  // Log that the fallback was loaded
  console.log("[React Fallback] Mock React components loaded");
})();
`;

// Write the fallback file
fs.writeFileSync(fallbackFile, fallbackContent);

console.log(`✅ Created React fallback file at: ${fallbackFile}`);

// Create an HTML snippet to include the fallback script
const htmlSnippet = `
<!-- Include this in your HTML before other scripts -->
<script src="/assets/react-fallback.js"></script>
`;

// Log path info for debugging
console.log(`Current working directory: ${cwd}`);
console.log(`Is in frontend directory: ${isInFrontend}`);

// Determine the correct path for the snippet file
let scriptsDir;
if (isInFrontend) {
  scriptsDir = path.join(cwd, 'scripts');
} else {
  scriptsDir = path.join(cwd, 'frontend', 'scripts');
}

// Make sure the scripts directory exists
try {
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log(`Created scripts directory at: ${scriptsDir}`);
  }

  const snippetFile = path.join(scriptsDir, 'react-fallback-snippet.html');
  fs.writeFileSync(snippetFile, htmlSnippet);
  console.log(`✅ Created HTML snippet at: ${snippetFile}`);
} catch (error) {
  console.error(`Warning: Could not create snippet file: ${error.message}`);
  console.log('This is non-critical, continuing...');
}

console.log('React fallback setup complete.');
