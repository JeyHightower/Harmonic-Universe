/**
 * Script to fix broken symlinks in the static directory
 * This is needed after a build if the copy process failed for files that should be symlinks
 */
const fs = require('fs');
const path = require('path');

// Define paths
const staticDir = path.join(__dirname, '../../static');
const reactFixesDir = path.join(staticDir, 'react-fixes');

console.log('Starting symlink repair...');

// Ensure the react-fixes directory exists
if (!fs.existsSync(reactFixesDir)) {
    fs.mkdirSync(reactFixesDir, { recursive: true });
    console.log(`Created directory: ${reactFixesDir}`);
}

// Map of symlinks to create: targetFile -> sourceFile
const SYMLINKS = {
    // React fix symlinks
    'react-polyfill.js': 'react-fixes/react-polyfill.js',
    'vendor-react.js': 'react-fixes/vendor-react.js',
    'vendor-react-DJ7Kff-Q.js': 'react-fixes/vendor-react-DJ7Kff-Q.js',
    'dynamic-import.js': 'react-fixes/dynamic-import.js',
    'critical-react-fix.js': 'react-fixes/critical-react-fix.js',
    'react-diagnostics.js': 'react-fixes/react-diagnostics.js',
    'react-context-fix.js': 'react-fixes/react-context-fix.js',
    'react-hook-fix.js': 'react-fixes/react-hook-fix.js',
    'hook-js-patcher.js': 'react-fixes/hook-js-patcher.js',
    'redux-provider-fix.js': 'react-fixes/redux-provider-fix.js',
    'runtime-diagnostics.js': 'react-fixes/runtime-diagnostics.js',
    'direct-hook-patcher.js': 'react-fixes/direct-hook-patcher.js',
    'early-warning-interceptor.js': 'react-fixes/early-warning-interceptor.js',
    'final-hook-suppressor.js': 'react-fixes/final-hook-suppressor.js',
    'react-context-provider.js': 'react-fixes/react-context-provider.js'
};

let createdCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Create or repair symlinks
Object.entries(SYMLINKS).forEach(([target, source]) => {
    const targetPath = path.join(staticDir, target);
    const sourcePath = path.join(staticDir, source);
    const relativePath = path.relative(path.dirname(targetPath), sourcePath);

    try {
        // If the target file doesn't exist or isn't a symlink, create it
        let needsSymlink = false;

        if (!fs.existsSync(targetPath)) {
            console.log(`Target doesn't exist: ${target}`);
            needsSymlink = true;
        } else if (!fs.lstatSync(targetPath).isSymbolicLink()) {
            console.log(`Target exists but is not a symlink: ${target}`);
            // Remove the existing file
            fs.unlinkSync(targetPath);
            needsSymlink = true;
        } else {
            // It's already a symlink, check if it's pointing to the right place
            const currentTarget = fs.readlinkSync(targetPath);
            if (currentTarget !== relativePath && currentTarget !== sourcePath) {
                console.log(`Target is a symlink but points to wrong location: ${target} -> ${currentTarget}`);
                fs.unlinkSync(targetPath);
                needsSymlink = true;
            } else {
                console.log(`Symlink already correct: ${target} -> ${currentTarget}`);
                skippedCount++;
            }
        }

        if (needsSymlink) {
            // Make sure the source file exists
            if (!fs.existsSync(sourcePath) && target === source.split('/')[1]) {
                // Special case: the source is the target itself in the react-fixes directory
                // Copy the target to the source location if it exists at the root
                const rootFile = path.join(__dirname, '../../frontend/public', target);
                if (fs.existsSync(rootFile)) {
                    // Copy from frontend/public to static/react-fixes
                    fs.copyFileSync(rootFile, sourcePath);
                    console.log(`Copied file from public to react-fixes: ${target}`);
                } else {
                    // Create an empty file
                    fs.writeFileSync(sourcePath, '// Placeholder file created during build repair');
                    console.log(`Created placeholder file: ${source}`);
                }
            }

            // Create the symlink
            fs.symlinkSync(relativePath, targetPath);
            console.log(`Created symlink: ${target} -> ${relativePath}`);
            createdCount++;
        }
    } catch (error) {
        console.error(`Error creating symlink for ${target}: ${error.message}`);
        errorCount++;
    }
});

console.log(`\nSymlink repair completed: Created ${createdCount}, Skipped ${skippedCount}, Errors ${errorCount}`);
