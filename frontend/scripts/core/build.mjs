// Core build script for Harmonic Universe frontend
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updatePaths } from '../utils/update-paths.mjs';

// Get script directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptDir = __dirname;
const scriptsRoot = path.resolve(scriptDir, '..');
const frontendRoot = path.resolve(scriptsRoot, '..');
const distDir = path.join(frontendRoot, 'dist');
const assetsDir = path.join(distDir, 'assets');

// Configuration options (defaults that can be overridden via env variables)
const config = {
  mode: process.env.BUILD_MODE || 'production',
  skipIconsFallback: process.env.SKIP_ICONS_FALLBACK === 'true',
  patchRollup: process.env.PATCH_ROLLUP === 'true',
  emptyOutDir: process.env.EMPTY_OUT_DIR !== 'false',
  configFile: process.env.CONFIG_FILE || './vite.config.js'
};

console.log('🚀 Starting build process...');
console.log('Build configuration:', config);

// Ensure directories exist
function ensureDirectories() {
  console.log('Ensuring directories exist...');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Created dist directory at: ${distDir}`);
  }
  
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log(`Created assets directory at: ${assetsDir}`);
  }
}

// Function to patch Rollup native module if needed
function patchRollupNative() {
  if (!config.patchRollup) return;
  
  console.log('Patching Rollup native module...');
  
  // Paths to Rollup native module
  const nativePath = path.resolve(frontendRoot, 'node_modules/rollup/dist/native.js');
  
  if (fs.existsSync(nativePath)) {
    // Create a patched version of native.js
    const patchedCode = `'use strict';

// This is a patched version that skips native module loading
// and always returns null to force pure JS implementation

Object.defineProperty(exports, '__esModule', { value: true });

function requireWithFriendlyError() {
  // Always return null to force pure JS implementation
  return null;
}

// Export patched functions
exports.getDefaultNativeFactory = function() {
  return null;
};

exports.getNativeFactory = function() {
  return null;
};

// Add exports that might be imported by ES modules
exports.parse = function() {
  return null;
};

exports.parseAsync = function() {
  return Promise.resolve(null);
};
`;

    // Backup the original file if not already backed up
    if (!fs.existsSync(`${nativePath}.bak`)) {
      fs.copyFileSync(nativePath, `${nativePath}.bak`);
    }
    
    fs.writeFileSync(nativePath, patchedCode);
    console.log('Successfully patched Rollup native module');
  } else {
    console.log('Rollup native.js not found, skipping patch');
  }
}

// Function to add Ant Icons fallback
function addAntIconsFallback() {
  if (config.skipIconsFallback) {
    console.log('Skipping Ant Icons fallback (disabled in config)');
    return;
  }
  
  console.log('Adding Ant Icons fallback...');
  
  // Add Ant Icons fallback reference to index.html
  const indexPath = path.join(distDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // Add the fallback script if not already present
    if (!indexContent.includes('window.__ANT_ICONS_FALLBACK_HANDLER__')) {
      console.log('Adding Ant Icons fallback handler to index.html');
      
      // Create the script to handle Ant Icons loading errors
      const fallbackScript = `
    <script>
      // Ant Design Icons fallback handler
      window.__ANT_ICONS_VERSION__ = "5.6.1";
      window.__ANT_ICONS_FALLBACK_HANDLER__ = function() {
        console.log("Running Ant Icons fallback handler");

        // Create basic icon component factory
        function createIconComponent(name) {
          return function(props) {
            return {
              $$typeof: Symbol.for('react.element'),
              type: 'span',
              props: {
                className: 'anticon anticon-' + name + (props && props.className ? ' ' + props.className : ''),
                style: props && props.style ? props.style : {},
                children: []
              }
            };
          };
        }

        // Create basic icons
        window.AntDesignIcons = {
          // Common icons
          CloseOutlined: createIconComponent('close'),
          CheckOutlined: createIconComponent('check'),
          LoadingOutlined: createIconComponent('loading'),
          DownOutlined: createIconComponent('down'),
          UpOutlined: createIconComponent('up'),
          LeftOutlined: createIconComponent('left'),
          RightOutlined: createIconComponent('right'),

          // API functions
          createFromIconfontCN: function() {
            return function() { return null; };
          },
          getTwoToneColor: function() { return '#1890ff'; },
          setTwoToneColor: function() {}
        };
      };

      // Set timeout to check if icons loaded correctly
      setTimeout(function() {
        if (!window.AntDesignIcons) {
          console.warn("Ant Design Icons not loaded correctly, applying fallback");
          window.__ANT_ICONS_FALLBACK_HANDLER__();
        }
      }, 1000);
    </script>`;

      // Insert the script before the closing head tag
      indexContent = indexContent.replace('</head>', fallbackScript + '\n</head>');

      // Write the updated content back to index.html
      fs.writeFileSync(indexPath, indexContent);
      console.log('Successfully added Ant Icons fallback handler to index.html');
    } else {
      console.log('Ant Icons fallback handler already present in index.html');
    }
  } else {
    console.warn('index.html not found in dist directory, skipping Ant Icons fallback');
  }
}

// Main build function
function runBuild() {
  console.log('Running Vite build...');
  
  try {
    // Set environment variables for build
    process.env.NODE_ENV = config.mode;
    
    // Determine package manager
    const packageJsonPath = path.join(frontendRoot, 'package.json');
    let packageManager = 'npm';
    
    if (fs.existsSync(packageJsonPath)) {
      // Check for npm/yarn/pnpm lock files
      if (fs.existsSync(path.join(frontendRoot, 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm';
      } else if (fs.existsSync(path.join(frontendRoot, 'yarn.lock'))) {
        packageManager = 'yarn';
      }
    }
    
    console.log(`Using package manager: ${packageManager}`);
    
    // Build command
    let buildCommand = '';
    switch (packageManager) {
      case 'pnpm':
        buildCommand = `pnpm exec vite build --config ${config.configFile} --mode ${config.mode}`;
        break;
      case 'yarn':
        buildCommand = `yarn vite build --config ${config.configFile} --mode ${config.mode}`;
        break;
      default: // npm
        buildCommand = `npx vite build --config ${config.configFile} --mode ${config.mode}`;
    }
    
    // Execute build
    console.log(`Executing: ${buildCommand}`);
    execSync(buildCommand, { stdio: 'inherit', cwd: frontendRoot });
    
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Check build output
function verifyBuild() {
  console.log('Verifying build output...');
  
  if (fs.existsSync(distDir)) {
    // Check for index.html and assets
    const hasIndexHtml = fs.existsSync(path.join(distDir, 'index.html'));
    const hasAssets = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0;
    
    if (hasIndexHtml && hasAssets) {
      console.log('✅ Build verification passed.');
    } else {
      console.warn('⚠️ Build verification warning: Some expected files missing.');
      console.log(`  index.html: ${hasIndexHtml ? 'Found' : 'Missing'}`);
      console.log(`  assets: ${hasAssets ? 'Found' : 'Missing or empty'}`);
    }
  } else {
    console.error('❌ Build verification failed: dist directory not found.');
    process.exit(1);
  }
}

// Function to update paths in built files
function runUpdatePaths() {
  console.log('Updating paths in built files...');
  try {
    // Execute the update-paths script
    updatePaths(distDir);
    console.log('✅ Paths updated successfully.');
  } catch (error) {
    console.error('Failed to update paths:', error);
  }
}

// Run the build process
ensureDirectories();
patchRollupNative();
runBuild();
addAntIconsFallback();
verifyBuild();
runUpdatePaths();

console.log('👍 Build process completed!'); 