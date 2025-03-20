// Enhanced postinstall script with robust error handling (CommonJS version)
const fs = require('fs');
const path = require('path');

console.log('[' + new Date().toISOString() + '] Starting postinstall patching process...');

// Get current directory
const currentDir = process.cwd();
console.log('[' + new Date().toISOString() + '] Current directory:', currentDir);

// Find node_modules directory
const nodeModulesPath = path.join(currentDir, 'node_modules');
console.log('[' + new Date().toISOString() + '] Checking potential node_modules path:', nodeModulesPath);

if (fs.existsSync(nodeModulesPath)) {
    console.log('[' + new Date().toISOString() + '] Found valid node_modules at:', nodeModulesPath);

    // Patch @ant-design/icons
    console.log('[' + new Date().toISOString() + '] Patching @ant-design/icons...');
    const iconsPath = path.join(nodeModulesPath, '@ant-design/icons');
    console.log('[' + new Date().toISOString() + '] Checking Ant Design Icons path:', iconsPath);

    if (fs.existsSync(iconsPath)) {
        console.log('[' + new Date().toISOString() + '] Found @ant-design/icons at:', iconsPath);

        // Create version.js in lib directory
        const libVersionPath = path.join(iconsPath, 'lib/version.js');
        console.log('[' + new Date().toISOString() + '] Creating version.js at:', libVersionPath);
        fs.mkdirSync(path.dirname(libVersionPath), { recursive: true });
        fs.writeFileSync(libVersionPath, 'exports.version = "5.6.1";\n');
        console.log('[' + new Date().toISOString() + '] Successfully created version.js');

        // Create version.js in es directory
        const esVersionPath = path.join(iconsPath, 'es/version.js');
        console.log('[' + new Date().toISOString() + '] Creating ES module version.js at:', esVersionPath);
        fs.mkdirSync(path.dirname(esVersionPath), { recursive: true });
        fs.writeFileSync(esVersionPath, 'export const version = "5.6.1";\n');
        console.log('[' + new Date().toISOString() + '] Successfully created ES module version.js');
    }

    // Create utility files
    console.log('[' + new Date().toISOString() + '] Creating utility files in src/utils...');
    const utilsDir = path.join(currentDir, 'src/utils');
    fs.mkdirSync(utilsDir, { recursive: true });

    // Create ant-icons-shim.js
    const shimPath = path.join(utilsDir, 'ant-icons-shim.js');
    console.log('[' + new Date().toISOString() + '] Creating ant-icons-shim.js at:', shimPath);
    fs.writeFileSync(shimPath, `
import * as AntdIcons from '@ant-design/icons';

if (!window.__ANT_ICONS_VERSION) {
  window.__ANT_ICONS_VERSION = {
    version: '5.6.1',
    prefix: 'anticon'
  };
}

if (!window.__ANT_ICONS_REGISTRY) {
  window.__ANT_ICONS_REGISTRY = new Map();
}

Object.entries(AntdIcons).forEach(([name, component]) => {
  if (name.match(/^[A-Z]/) && typeof component === 'object') {
    window.__ANT_ICONS_REGISTRY.set(name, component);
  }
});

window.getAntIcon = function(name) {
  return window.__ANT_ICONS_REGISTRY.get(name);
};

export const IconRegistry = window.__ANT_ICONS_REGISTRY;
export const getIcon = window.getAntIcon;
export const version = window.__ANT_ICONS_VERSION;
`);
    console.log('[' + new Date().toISOString() + '] Successfully created utility files');
} else {
    console.error('[' + new Date().toISOString() + '] Could not find node_modules directory');
}

// Ensure directories exist
const dirs = [
    'src/utils',
    'static/react-fixes',
    'scripts'
];

dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Create necessary files if they don't exist
const files = {
    'src/utils/ant-icons-shim.js': `import * as AntdIcons from '@ant-design/icons';
export * from '@ant-design/icons';`,
    'src/utils/react-diagnostics.js': `// React diagnostics utilities
export const diagnostics = {
  contexts: new Map(),
  registerContext: (name, context) => {
    diagnostics.contexts.set(name, context);
  },
  getContext: (name) => diagnostics.contexts.get(name),
};`
};

Object.entries(files).forEach(([file, content]) => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`Created file: ${file}`);
    }
});

console.log('[' + new Date().toISOString() + '] Postinstall patching process completed successfully');
