#!/usr/bin/env node

/**
 * This script patches Ant Design icons to work with inline scripts
 */

import fs from 'fs';
import path from 'path';
import pkg from 'glob';
const glob = pkg;

console.log('Direct inline patching of ant-icons file...');

// Get the current working directory and determine if we're already in frontend
const cwd = process.cwd();
const isInFrontend = cwd.endsWith('/frontend') || cwd.endsWith('\\frontend');
console.log(`Current working directory: ${cwd}`);
console.log(`Is in frontend directory: ${isInFrontend}`);

// Find all ant-icons chunk files in the dist directory
const distDir = path.join(cwd, 'dist');
const pattern = path.join(distDir, 'assets/ant-icons-*.js');
console.log(`Looking for files matching: ${pattern}`);

let antIconsFiles;
try {
  antIconsFiles = glob.sync(pattern);
  console.log(`Found ${antIconsFiles.length} ant-icons files`);
} catch (error) {
  console.error(`Error finding ant-icons files: ${error.message}`);
  process.exit(1);
}

if (antIconsFiles.length === 0) {
  console.error('No ant-icons files found');
  process.exit(1);
}

// Process each ant-icons file
for (const file of antIconsFiles) {
  console.log(`Processing ${file}...`);

  // Read file content
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`Error reading ${file}: ${error.message}`);
    continue;
  }

  // Create inline patch with all needed functions
  const inlineCode = `
// ====== BEGIN DIRECT INLINE PATCH ======
// This ensures that all required functions are directly available in this file

// Define createContext function directly in the file scope
var createContext = function(defaultValue) {
  return {
    Provider: function Provider(props) {
      return props && props.children ? props.children : null;
    },
    Consumer: function Consumer(props) {
      return props && props.children ? props.children(defaultValue) : null;
    },
    displayName: "IconContext",
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    version: "4.2.1"
  };
};

// Define React directly in this file
var React = {
  createElement: function() { return {}; },
  createContext: createContext,
  version: "16.8.0"
};

// Define IconContext directly
var IconContext = createContext({
  prefixCls: 'anticon',
  rtl: false
});
IconContext.version = "4.2.1";

// Define version
var version = "4.2.1";

// Make everything global too
if (typeof window !== 'undefined') {
  window.React = window.React || React;
  window.createContext = createContext;
  window.IconContext = IconContext;
  window.version = version;
}

// Helper function to safely get version
function getVersion(obj) {
  return (obj && typeof obj !== 'undefined' && obj.version) ? obj.version : "4.2.1";
}
// ====== END DIRECT INLINE PATCH ======

`;

  // Inject the inline code at the beginning of the file
  const patchedContent = inlineCode + content;

  // Find and replace all React.createContext calls to use the inlined function
  const replacedContent = patchedContent.replace(
    /React\.createContext/g,
    'createContext'
  );

  // Write the updated file
  try {
    fs.writeFileSync(file, replacedContent);
    console.log(`✅ Successfully patched ${file}`);
  } catch (error) {
    console.error(`Error writing ${file}: ${error.message}`);
  }
}

console.log('Direct inline patching complete');
