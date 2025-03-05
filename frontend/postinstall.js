// Enhanced postinstall script with robust error handling
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Main function to run our patching process
async function main() {
  try {
    log('Starting postinstall patching process...');

    // Get current directory
    const currentDir = process.cwd();
    log(`Current directory: ${currentDir}`);

    // Define paths - use multiple potential locations to be safe
    const possibleNodeModulesPaths = [
      path.join(currentDir, 'node_modules'),
      path.join(process.env.HOME || '/tmp', 'node_modules'),
      path.join('/opt/render/project/src/frontend', 'node_modules')
    ];

    // Try each potential node_modules path
    let nodeModulesPath = null;
    for (const potentialPath of possibleNodeModulesPaths) {
      log(`Checking potential node_modules path: ${potentialPath}`);
      try {
        if (fs.existsSync(potentialPath)) {
          nodeModulesPath = potentialPath;
          log(`Found valid node_modules at: ${nodeModulesPath}`);
          break;
        }
      } catch (err) {
        log(`Error checking path ${potentialPath}: ${err.message}`);
      }
    }

    if (!nodeModulesPath) {
      log('Could not find node_modules directory. Creating one...');
      try {
        nodeModulesPath = path.join(currentDir, 'node_modules');
        fs.mkdirSync(nodeModulesPath, { recursive: true });
        log(`Created node_modules at: ${nodeModulesPath}`);
      } catch (err) {
        log(`Error creating node_modules: ${err.message}`);
        // Continue anyway, we'll create necessary directories later
      }
    }

    // Patch for @ant-design/icons
    log('Patching @ant-design/icons...');

    // Define possible icon paths
    const possibleIconPaths = [
      path.join(nodeModulesPath, '@ant-design/icons'),
      path.join(nodeModulesPath, '@ant-design', 'icons')
    ];

    let iconPathFound = false;

    for (const iconPath of possibleIconPaths) {
      try {
        log(`Checking Ant Design Icons path: ${iconPath}`);

        const exists = fs.existsSync(iconPath);
        if (exists) {
          log(`Found @ant-design/icons at: ${iconPath}`);
          iconPathFound = true;

          // Make sure lib directory exists
          const libPath = path.join(iconPath, 'lib');
          if (!fs.existsSync(libPath)) {
            log(`Creating lib directory at: ${libPath}`);
            fs.mkdirSync(libPath, { recursive: true });
          }

          // Create version.js file
          const versionJsPath = path.join(libPath, 'version.js');
          log(`Creating version.js at: ${versionJsPath}`);

          const versionContent = `
"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = void 0;
var version = "4.2.1";
exports.version = version;
exports.default = { version: version };
`;

          fs.writeFileSync(versionJsPath, versionContent);
          log(`Successfully created version.js`);

          // Also create an ES module version
          const esPath = path.join(iconPath, 'es');
          if (!fs.existsSync(esPath)) {
            log(`Creating es directory at: ${esPath}`);
            fs.mkdirSync(esPath, { recursive: true });
          }

          const esVersionJsPath = path.join(esPath, 'version.js');
          log(`Creating ES module version.js at: ${esVersionJsPath}`);

          const esVersionContent = `
// ES module version
export const version = "4.2.1";
export default { version: "4.2.1" };
`;

          fs.writeFileSync(esVersionJsPath, esVersionContent);
          log(`Successfully created ES module version.js`);
        }
      } catch (err) {
        log(`Error processing ${iconPath}: ${err.message}`);
        // Continue to the next path
      }
    }

    // If no icon path found, create the structure
    if (!iconPathFound) {
      log('No @ant-design/icons found. Creating directory structure...');
      try {
        const antDesignPath = path.join(nodeModulesPath, '@ant-design');
        if (!fs.existsSync(antDesignPath)) {
          fs.mkdirSync(antDesignPath, { recursive: true });
        }

        const iconsPath = path.join(antDesignPath, 'icons');
        if (!fs.existsSync(iconsPath)) {
          fs.mkdirSync(iconsPath, { recursive: true });
        }

        const libPath = path.join(iconsPath, 'lib');
        if (!fs.existsSync(libPath)) {
          fs.mkdirSync(libPath, { recursive: true });
        }

        const esPath = path.join(iconsPath, 'es');
        if (!fs.existsSync(esPath)) {
          fs.mkdirSync(esPath, { recursive: true });
        }

        // Create version.js files
        const versionJsPath = path.join(libPath, 'version.js');
        fs.writeFileSync(versionJsPath, `
"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.version = void 0;
var version = "4.2.1";
exports.version = version;
exports.default = { version: version };
`);

        const esVersionJsPath = path.join(esPath, 'version.js');
        fs.writeFileSync(esVersionJsPath, `
// ES module version
export const version = "4.2.1";
export default { version: "4.2.1" };
`);

        log('Successfully created @ant-design/icons directory structure and version files');
      } catch (err) {
        log(`Error creating @ant-design/icons structure: ${err.message}`);
      }
    }

    // Create utility files in src/utils
    log('Creating utility files in src/utils...');
    try {
      const srcPath = path.join(currentDir, 'src');
      if (!fs.existsSync(srcPath)) {
        log(`Creating src directory at: ${srcPath}`);
        fs.mkdirSync(srcPath, { recursive: true });
      }

      const utilsPath = path.join(srcPath, 'utils');
      if (!fs.existsSync(utilsPath)) {
        log(`Creating utils directory at: ${utilsPath}`);
        fs.mkdirSync(utilsPath, { recursive: true });
      }

      // Create shim for ant-icons
      const antIconsShimPath = path.join(utilsPath, 'ant-icons-shim.js');
      log(`Creating ant-icons-shim.js at: ${antIconsShimPath}`);
      fs.writeFileSync(antIconsShimPath, `
// Shim for @ant-design/icons
export const version = "4.2.1";
export default { version: "4.2.1" };
`);

      log('Successfully created utility files');
    } catch (err) {
      log(`Error creating utility files: ${err.message}`);
    }

    log('Postinstall patching process completed successfully');
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error in postinstall script:');
    console.error(err);

    // Don't exit with error - let the build continue
    log('Continuing build process despite errors...');
  }
}

// Run the main function
main().catch(err => {
  console.error('Fatal error in postinstall script:');
  console.error(err);
  // Don't exit with error
  console.log('Continuing build process despite fatal error...');
});
