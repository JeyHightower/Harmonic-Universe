/**
 * Enhanced copy script that respects symlinks
 * Used after build to copy files from frontend/dist to the static directory
 * without breaking existing symlinks
 */
const fs = require('fs');
const path = require('path');

// Define paths
const distDir = path.join(__dirname, '../../frontend/dist');
const staticDir = path.join(__dirname, '../../static');

// Make sure static directory exists
if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
    console.log(`Created static directory: ${staticDir}`);
}

// Get list of files in the dist directory
console.log('Starting copy process with symlink protection...');
let copyCount = 0;
let skipCount = 0;
let errorCount = 0;

// Function to copy a file while respecting symlinks
function copyFile(sourcePath, destPath) {
    try {
        // Check if destination exists and is a symlink
        if (fs.existsSync(destPath)) {
            const stats = fs.lstatSync(destPath);

            // If it's a symlink, don't overwrite it
            if (stats.isSymbolicLink()) {
                console.log(`Skipping: ${path.basename(destPath)} (is a symlink)`);
                skipCount++;
                return;
            }
        }

        // Copy the file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${path.basename(destPath)}`);
        copyCount++;
    } catch (error) {
        console.error(`Error copying ${path.basename(sourcePath)}: ${error.message}`);
        errorCount++;
    }
}

// Process all files in the dist directory
function processDirectory(sourceDir, targetDir) {
    // Make sure the target directory exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Read all files in source directory
    const items = fs.readdirSync(sourceDir);

    items.forEach(item => {
        const sourcePath = path.join(sourceDir, item);
        const destPath = path.join(targetDir, item);

        // Get item stats
        const stats = fs.statSync(sourcePath);

        if (stats.isDirectory()) {
            // Recursively process subdirectories
            processDirectory(sourcePath, destPath);
        } else {
            // Copy files
            copyFile(sourcePath, destPath);
        }
    });
}

// Start the copy process
try {
    processDirectory(distDir, staticDir);
    console.log(`\nCopy completed: ${copyCount} files copied, ${skipCount} skipped, ${errorCount} errors`);
} catch (error) {
    console.error(`Process failed: ${error.message}`);
    process.exit(1);
}
