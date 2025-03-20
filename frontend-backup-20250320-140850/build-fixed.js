// Fixed ES Module build script for Render
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Create a require function for ES modules
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables to force pure JS implementation
process.env.ROLLUP_SKIP_NODEJS_NATIVE_BUILD = 'true';
process.env.ROLLUP_NATIVE_PURE_JS = 'true';
process.env.ROLLUP_DISABLE_NATIVE = 'true';
process.env.VITE_SKIP_ROLLUP_NATIVE = 'true';
process.env.VITE_PURE_JS = 'true';
process.env.VITE_FORCE_ESM = 'true';

console.log('🚀 Starting fixed build process...');

// First, check and patch any Rollup native module issues
const nativePath = resolve(__dirname, 'node_modules/rollup/dist/native.js');
if (fs.existsSync(nativePath)) {
    console.log('🔧 Patching Rollup native module...');

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

    // Backup the original file
    try {
        fs.copyFileSync(nativePath, `${nativePath}.bak`);
        fs.writeFileSync(nativePath, patchedCode);
        console.log('✅ Successfully patched Rollup native module');
    } catch (error) {
        console.error('❌ Error patching Rollup native module:', error);
    }
}

// Look for problematic ES imports from CommonJS modules
const patchImportIssues = () => {
    console.log('🔍 Searching for problematic imports...');

    // Common problematic import paths
    const problematicPaths = [
        resolve(__dirname, 'node_modules/rollup/dist'),
        resolve(__dirname, 'node_modules/@rollup')
    ];

    problematicPaths.forEach(dir => {
        if (!fs.existsSync(dir)) return;

        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (!file.endsWith('.js')) return;

                const filePath = resolve(dir, file);
                const content = fs.readFileSync(filePath, 'utf8');

                // Check for problematic import pattern
                if (content.includes("import { parse, parseAsync } from '../../native.js'")) {
                    console.log(`🔧 Found problematic import in ${filePath}, patching...`);

                    // Backup the file
                    fs.copyFileSync(filePath, `${filePath}.bak`);

                    // Replace the problematic import
                    const fixedContent = content.replace(
                        "import { parse, parseAsync } from '../../native.js'",
                        "import pkg from '../../native.js';\nconst { parse, parseAsync } = pkg;"
                    );

                    fs.writeFileSync(filePath, fixedContent);
                    console.log(`✅ Successfully patched ${filePath}`);
                }
            });
        } catch (error) {
            console.error(`❌ Error searching directory ${dir}:`, error);
        }
    });
};

// Execute the import issue patching
patchImportIssues();

// Now attempt to load and run Vite build
console.log('🔨 Attempting to load Vite...');

try {
    // Dynamic import Vite
    import('vite').then(async ({ build }) => {
        console.log('✅ Successfully loaded Vite');

        try {
            console.log('🔨 Starting build with fixed configuration...');
            await build({
                mode: 'production',
                emptyOutDir: true,
                configFile: './vite.config.render.js'
            });
            console.log('✅ Build completed successfully!');
        } catch (buildError) {
            console.error('❌ Build failed:', buildError);
            process.exit(1);
        }
    }).catch(importError => {
        console.error('❌ Failed to import Vite:', importError);

        // Try fallback with require
        console.log('🔄 Trying fallback with CommonJS require...');
        try {
            const vite = require('vite');
            console.log('✅ Successfully loaded Vite via require');

            vite.build({
                mode: 'production',
                emptyOutDir: true,
                configFile: './vite.config.render.js'
            }).catch(err => {
                console.error('❌ Build failed with CommonJS fallback:', err);
                process.exit(1);
            });
        } catch (requireError) {
            console.error('❌ Failed to require Vite:', requireError);
            process.exit(1);
        }
    });
} catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
}
