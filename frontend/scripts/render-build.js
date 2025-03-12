#!/usr/bin/env node

/**
 * Script to build frontend assets for Render.com deployment
 * This script is called from the project's render.yaml during the build phase
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const FRONTEND_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(FRONTEND_DIR, 'dist');
const STATIC_DIR = path.resolve(FRONTEND_DIR, '..', 'static');

console.log('🚀 Starting Render.com frontend build process...');

// Function to execute shell commands and log output
function runCommand(command, cwd = FRONTEND_DIR) {
    console.log(`\n📋 Executing: ${command}\n`);
    try {
        execSync(command, { cwd, stdio: 'inherit' });
    } catch (error) {
        console.error(`\n❌ Command failed: ${command}`);
        console.error(error);
        process.exit(1);
    }
}

// Main build process
try {
    // Step 1: Ensure we have the latest dependencies
    console.log('📦 Installing dependencies...');
    runCommand('npm install');

    // Step 2: Build the frontend
    console.log('🔨 Building frontend assets...');
    runCommand('npm run build');

    // Step 3: Ensure destination directory exists
    console.log('📁 Setting up static directory...');
    if (!fs.existsSync(STATIC_DIR)) {
        fs.mkdirSync(STATIC_DIR, { recursive: true });
    }

    // Step 4: Copy built assets to the static directory for Flask to serve
    console.log('📋 Copying built assets to static directory...');
    runCommand(`cp -r ${DIST_DIR}/* ${STATIC_DIR}/`);

    // Step 5: Ensure any required public files are copied
    const publicDir = path.resolve(FRONTEND_DIR, 'public');
    if (fs.existsSync(publicDir)) {
        console.log('📋 Copying public files...');

        // Copy polyfills and other critical scripts
        const criticalFiles = [
            'react-polyfill.js',
            'react-context-provider.js',
            'favicon.ico'
        ];

        criticalFiles.forEach(file => {
            const sourcePath = path.resolve(publicDir, file);
            const destPath = path.resolve(STATIC_DIR, file);

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`Copied ${file} to static directory`);
            } else {
                console.log(`File ${file} not found in public directory, skipping`);
            }
        });
    }

    console.log('\n✅ Frontend build completed successfully!');
} catch (error) {
    console.error('\n❌ Build process failed:');
    console.error(error);
    process.exit(1);
}
