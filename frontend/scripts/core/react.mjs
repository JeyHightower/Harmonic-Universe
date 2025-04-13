/**
 * Core React Utilities
 * 
 * This script combines various React-related utility functions:
 * - React dependency ensuring
 * - React context creation
 * - React provider helpers
 * - React fallback generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(scriptsRoot, '..');

// Constants
const REACT_VERSION = '18.2.0';

// Create a fallback for React context
function createMockContext(defaultValue) {
  return {
    Provider: function Provider(props) { return props.children || null; },
    Consumer: function Consumer(props) { return props.children ? props.children(defaultValue) : null; },
    displayName: 'MockContext',
    _currentValue: defaultValue,
    _currentValue2: defaultValue
  };
}

// Ensure React is available
function ensureReact() {
  console.log('Ensuring React is available...');
  
  // Create a React fallback shim if needed
  const reactFallbackContent = `
// React fallback script
// This provides a minimal React API when React fails to load
window.React = window.React || {
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
  },
  version: "${REACT_VERSION}"
};

// Ensure version is available
if (window.React) window.React.version = window.React.version || "${REACT_VERSION}";

console.log("[React Fallback] React shim loaded with version:", window.React.version);
`;

  // Create the assets directory if it doesn't exist
  const assetsDir = path.join(frontendRoot, 'dist', 'assets');
  try {
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Write the fallback file
    const fallbackFilePath = path.join(assetsDir, 'react-fallback.js');
    fs.writeFileSync(fallbackFilePath, reactFallbackContent);
    console.log(`Created React fallback at: ${fallbackFilePath}`);
    
    return true;
  } catch (error) {
    console.error('Error creating React fallback:', error);
    return false;
  }
}

// Insert React fallback script reference into index.html
function injectReactFallback() {
  console.log('Injecting React fallback script into index.html...');
  
  const indexPath = path.join(frontendRoot, 'dist', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return false;
  }
  
  try {
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if the script is already included
    if (indexContent.includes('react-fallback.js')) {
      console.log('React fallback script already present in index.html');
      return true;
    }
    
    // Insert the script tag before the closing head tag
    const scriptTag = '<script src="/assets/react-fallback.js"></script>';
    indexContent = indexContent.replace('</head>', `  ${scriptTag}\n</head>`);
    
    // Write the updated content back
    fs.writeFileSync(indexPath, indexContent);
    console.log('Successfully injected React fallback script into index.html');
    
    return true;
  } catch (error) {
    console.error('Error injecting React fallback script:', error);
    return false;
  }
}

// Ensure Redux provider is properly configured
function ensureReduxProvider() {
  console.log('Checking for Redux provider...');
  
  // Check if Redux is being used
  const hasRedux = fs.existsSync(path.join(frontendRoot, 'src', 'store')) || 
                  fs.existsSync(path.join(frontendRoot, 'src', 'redux')) ||
                  fs.existsSync(path.join(frontendRoot, 'node_modules', 'redux'));
  
  if (hasRedux) {
    console.log('Redux detected, creating provider fallback...');
    
    const reduxFallbackContent = `
// Redux Provider fallback
window.Redux = window.Redux || {};
window.ReactRedux = window.ReactRedux || {
  Provider: function(props) {
    return props.children || null;
  },
  connect: function() {
    return function(component) {
      return component;
    };
  },
  useSelector: function(selector) {
    return {};
  },
  useDispatch: function() {
    return function() {};
  }
};
console.log("[Redux Fallback] Redux Provider shim loaded");
`;
    
    // Create the assets directory if it doesn't exist
    const assetsDir = path.join(frontendRoot, 'dist', 'assets');
    try {
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      // Write the fallback file
      const fallbackFilePath = path.join(assetsDir, 'redux-fallback.js');
      fs.writeFileSync(fallbackFilePath, reduxFallbackContent);
      console.log(`Created Redux fallback at: ${fallbackFilePath}`);
      
      // Inject the script into index.html
      const indexPath = path.join(frontendRoot, 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Check if the script is already included
        if (!indexContent.includes('redux-fallback.js')) {
          // Insert the script tag before the closing head tag
          const scriptTag = '<script src="/assets/redux-fallback.js"></script>';
          indexContent = indexContent.replace('</head>', `  ${scriptTag}\n</head>`);
          
          // Write the updated content back
          fs.writeFileSync(indexPath, indexContent);
          console.log('Successfully injected Redux fallback script into index.html');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error creating Redux fallback:', error);
      return false;
    }
  }
  
  console.log('Redux not detected, skipping provider fallback');
  return false;
}

// Process all React-related utilities
function processReact() {
  console.log('Processing React utilities...');
  
  ensureReact();
  injectReactFallback();
  ensureReduxProvider();
  
  console.log('React utilities processing complete');
  return true;
}

// Export functions
export {
  createMockContext,
  ensureReact,
  injectReactFallback,
  ensureReduxProvider,
  processReact as default
};

// Run if directly executed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processReact();
} 