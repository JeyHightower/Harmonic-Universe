/**
 * Debug Build Script
 *
 * This script helps diagnose issues with Ant Design Icons during the build process.
 * It will try to locate the Ant Design Icons package and verify the version property.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log with timestamp
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// Check if a file exists
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

// Main debug function
async function debugBuild() {
    log('Starting build diagnostics...');

    // Get current directory
    const currentDir = process.cwd();
    log(`Current directory: ${currentDir}`);

    // Check node_modules path
    const nodeModulesPath = path.join(currentDir, 'node_modules');
    log(`Checking node_modules at: ${nodeModulesPath}`);

    if (!fileExists(nodeModulesPath)) {
        log('⚠️ node_modules directory not found!');
    } else {
        log('✅ node_modules directory exists');

        // Check Ant Design Icons
        const antIconsPath = path.join(nodeModulesPath, '@ant-design/icons');
        log(`Checking Ant Design Icons at: ${antIconsPath}`);

        if (!fileExists(antIconsPath)) {
            log('⚠️ @ant-design/icons not found!');
        } else {
            log('✅ @ant-design/icons directory exists');

            // Check lib directory
            const libPath = path.join(antIconsPath, 'lib');
            log(`Checking lib directory at: ${libPath}`);

            if (!fileExists(libPath)) {
                log('⚠️ lib directory not found!');
            } else {
                log('✅ lib directory exists');

                // Check version.js file
                const versionJsPath = path.join(libPath, 'version.js');
                log(`Checking version.js at: ${versionJsPath}`);

                if (!fileExists(versionJsPath)) {
                    log('⚠️ version.js not found!');
                } else {
                    log('✅ version.js file exists');

                    // Read and display file content
                    try {
                        const content = fs.readFileSync(versionJsPath, 'utf8');
                        log(`version.js content:\n${content}`);
                    } catch (err) {
                        log(`⚠️ Error reading version.js: ${err.message}`);
                    }
                }
            }

            // Check es directory
            const esPath = path.join(antIconsPath, 'es');
            log(`Checking es directory at: ${esPath}`);

            if (!fileExists(esPath)) {
                log('⚠️ es directory not found!');
            } else {
                log('✅ es directory exists');

                // Check version.js file in es
                const esVersionJsPath = path.join(esPath, 'version.js');
                log(`Checking es/version.js at: ${esVersionJsPath}`);

                if (!fileExists(esVersionJsPath)) {
                    log('⚠️ es/version.js not found!');
                } else {
                    log('✅ es/version.js file exists');

                    // Read and display file content
                    try {
                        const content = fs.readFileSync(esVersionJsPath, 'utf8');
                        log(`es/version.js content:\n${content}`);
                    } catch (err) {
                        log(`⚠️ Error reading es/version.js: ${err.message}`);
                    }
                }
            }

            // Check package.json
            const packageJsonPath = path.join(antIconsPath, 'package.json');
            log(`Checking package.json at: ${packageJsonPath}`);

            if (!fileExists(packageJsonPath)) {
                log('⚠️ package.json not found!');
            } else {
                log('✅ package.json file exists');

                // Read and display version from package.json
                try {
                    const content = fs.readFileSync(packageJsonPath, 'utf8');
                    const packageJson = JSON.parse(content);
                    log(`Ant Design Icons version from package.json: ${packageJson.version}`);
                } catch (err) {
                    log(`⚠️ Error reading package.json: ${err.message}`);
                }
            }
        }
    }

    // Check src/utils directory
    const utilsPath = path.join(currentDir, 'src', 'utils');
    log(`Checking src/utils at: ${utilsPath}`);

    if (!fileExists(utilsPath)) {
        log('⚠️ src/utils directory not found!');
    } else {
        log('✅ src/utils directory exists');

        // Check for ant-icons-shim.js
        const shimPath = path.join(utilsPath, 'ant-icons-shim.js');
        log(`Checking ant-icons-shim.js at: ${shimPath}`);

        if (!fileExists(shimPath)) {
            log('⚠️ ant-icons-shim.js not found!');
        } else {
            log('✅ ant-icons-shim.js file exists');
        }
    }

    // Check for vite plugins directory
    const vitePluginsPath = path.join(currentDir, 'vite-plugins');
    log(`Checking vite-plugins at: ${vitePluginsPath}`);

    if (!fileExists(vitePluginsPath)) {
        log('⚠️ vite-plugins directory not found!');
    } else {
        log('✅ vite-plugins directory exists');

        // Check for ant-icons-fix.js
        const antIconsFixPath = path.join(vitePluginsPath, 'ant-icons-fix.js');
        log(`Checking ant-icons-fix.js at: ${antIconsFixPath}`);

        if (!fileExists(antIconsFixPath)) {
            log('⚠️ ant-icons-fix.js not found!');
        } else {
            log('✅ ant-icons-fix.js file exists');
        }
    }

    log('Build diagnostics completed');
}

// Run the debug function
debugBuild().catch(err => {
    console.error('Error running build diagnostics:');
    console.error(err);
});
