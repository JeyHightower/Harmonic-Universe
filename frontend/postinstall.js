const fs = require('fs');
const path = require('path');

// Path to node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');

console.log('Applying patches to node_modules...');

// Patch for @ant-design/icons if it exists
const antIconsPath = path.join(nodeModulesPath, '@ant-design/icons');
if (fs.existsSync(antIconsPath)) {
    console.log('Found @ant-design/icons, applying patch...');

    // Create a version.js file
    const versionJsPath = path.join(antIconsPath, 'lib/version.js');
    fs.writeFileSync(versionJsPath, `
"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = void 0;
var version = "4.2.1";
exports.version = version;
  `);

    console.log('Patched', versionJsPath);
}

console.log('Patches applied successfully');
