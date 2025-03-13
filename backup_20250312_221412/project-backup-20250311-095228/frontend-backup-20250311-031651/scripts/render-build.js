// Script to handle Render.com specific build process
// This script skips husky installation and handles any other Render-specific build steps

console.log('📦 Starting Render.com build process for frontend...');

// Set environment variables
process.env.RENDER = 'true';
process.env.NODE_ENV = 'production';
process.env.VITE_APP_ENV = 'production';

// Move to the parent directory and install npm packages
import { execSync } from 'node:child_process';
execSync('cd .. && npm install', { stdio: 'inherit' });
// Import necessary modules
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    frontendDir: path.resolve(__dirname, '..'),
    staticDir: path.resolve(__dirname, '../../static'),
    reactFixesDir: path.resolve(__dirname, '../../static/react-fixes'),
    distDir: path.resolve(__dirname, '../dist'),
    nodeEnv: process.env.NODE_ENV || 'production'
};

console.log('Build Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    VITE_APP_ENV: process.env.VITE_APP_ENV,
    frontendDir: config.frontendDir,
    staticDir: config.staticDir,
    distDir: config.distDir
});

console.log('Copying from:', config.distDir);
console.log('Copying to:', config.staticDir);

// Utility functions
const log = {
    info: (msg) => console.log(`\x1b[36m[Build]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[Build]\x1b[0m ${msg}`),
    warning: (msg) => console.log(`\x1b[33m[Build]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[Build Error]\x1b[0m ${msg}`)
};

// Ensure the static directory exists
async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function copyDir(src, dest) {
    await ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function ensureDirectories() {
    log.info('Creating necessary directories...');
    await ensureDir(config.staticDir);
    await ensureDir(config.reactFixesDir);
}

async function installDependencies() {
    log.info('Installing dependencies...');
    try {
        // Change to frontend directory
        process.chdir(config.frontendDir);

        // Clean install
        log.info('Removing node_modules...');
        try {
            await fs.rm(path.join(config.frontendDir, 'node_modules'), { recursive: true, force: true });
        } catch (e) {
            log.warning('No existing node_modules to remove');
        }

        // Install dependencies with legacy peer deps
        log.info('Installing npm dependencies...');
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

        // Explicitly install Vite
        log.info('Installing Vite...');
        execSync('npm install vite@latest @vitejs/plugin-react@latest --save-dev', { stdio: 'inherit' });

        log.success('Dependencies installed successfully');
    } catch (error) {
        log.error('Failed to install dependencies');
        throw error;
    }
}

async function runViteBuild() {
    log.info('Running Vite build...');
    try {
        // Ensure we're in the frontend directory
        process.chdir(config.frontendDir);
        log.info('Current working directory: ' + process.cwd());

        // Run the build using npx to ensure we use the local installation
        log.info('Running build command...');
        execSync('npx vite build', { stdio: 'inherit' });

        log.success('Build completed successfully');
    } catch (error) {
        log.error('Build failed');
        log.error(error.message);
        throw error;
    }
}

async function copyReactFiles() {
    log.info('Copying React production files...');
    const nodeModules = path.join(config.frontendDir, 'node_modules');

    const files = {
        react: path.join(nodeModules, 'react/umd/react.production.min.js'),
        reactDom: path.join(nodeModules, 'react-dom/umd/react-dom.production.min.js')
    };

    for (const [name, src] of Object.entries(files)) {
        try {
            const dest = path.join(config.staticDir, path.basename(src));
            await fs.copyFile(src, dest);
            log.success(`Copied ${path.basename(src)}`);
        } catch (error) {
            log.warning(`Could not copy ${name}: ${error.message}`);
        }
    }
}

async function createIndexHtml() {
    log.info('Creating index.html...');
    const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
    <script src="/react.production.min.js"></script>
    <script src="/react-dom.production.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;

    await fs.writeFile(path.join(config.staticDir, 'index.html'), content);
    log.success('Created index.html');
}

async function copyBuildFiles() {
    log.info('Copying build files...');
    try {
        await fs.access(config.distDir);
    } catch {
        throw new Error('Build failed - dist directory not created');
    }
    await copyDir(config.distDir, config.staticDir);
}

async function build() {
    try {
        log.info('Starting build process...');

        // Install dependencies first
        await installDependencies();

        // Ensure directories exist
        await ensureDir(config.staticDir);

        // Run Vite build
        await runViteBuild();

        // Copy build files to static directory
        await copyBuildFiles();

        // Copy React production files
        await copyReactFiles();

        // Create index.html if it doesn't exist
        await createIndexHtml();

        log.success('Build process completed successfully');
    } catch (error) {
        log.error(`Build failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the build
build();
