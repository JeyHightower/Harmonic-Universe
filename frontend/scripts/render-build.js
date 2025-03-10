// Script to handle Render.com specific build process
// This script skips husky installation and handles any other Render-specific build steps

console.log('📦 Starting Render.com build process for frontend...');

// Set environment variables
process.env.RENDER = 'true';
process.env.NODE_ENV = 'production';
process.env.VITE_APP_ENV = 'production';

import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    frontendDir: path.resolve(__dirname, '..'),
    staticDir: path.resolve(__dirname, '../static'),
    reactFixesDir: path.resolve(__dirname, '../static/react-fixes'),
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

async function runViteBuild() {
    log.info('Running Vite build...');
    try {
        process.chdir(config.frontendDir);
        log.info('Current working directory: ' + process.cwd());
        log.info('Checking for vite.config.js...');

        try {
            await fs.access('vite.config.js');
            log.success('vite.config.js found');
        } catch (err) {
            log.warning('vite.config.js not found in ' + process.cwd());
        }

        log.info('Running npm install to ensure dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        log.info('Starting Vite build...');
        execSync('npm run vite:build', { stdio: 'inherit' });
    } catch (error) {
        log.error('Vite build failed');
        log.error('Error details:');
        log.error(error.message);
        if (error.stdout) log.error('stdout:', error.stdout.toString());
        if (error.stderr) log.error('stderr:', error.stderr.toString());
        throw error;
    }
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

// Utility functions
const log = {
    info: (msg) => console.log(`\x1b[36m[Build]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[Build]\x1b[0m ${msg}`),
    warning: (msg) => console.log(`\x1b[33m[Build]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[Build Error]\x1b[0m ${msg}`)
};

async function createVersionFile() {
    log.info('Creating version.js...');
    const content = `window.BUILD_VERSION = '${Date.now()}';`;
    await fs.writeFile(path.join(config.staticDir, 'version.js'), content);
}

async function createBuildInfo() {
    log.info('Creating build-info.json...');
    const buildInfo = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv
    };
    await fs.writeFile(
        path.join(config.staticDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 4)
    );
}

async function copyFile(src, dest) {
    try {
        await fs.copyFile(src, dest);
        log.success(`Copied ${path.basename(dest)}`);
    } catch (error) {
        log.warning(`Could not copy ${path.basename(src)}: ${error.message}`);
    }
}

async function copyReactProductionFiles() {
    log.info('Copying React production files...');
    const files = {
        react: path.join(config.frontendDir, 'node_modules/react/umd/react.production.min.js'),
        reactDom: path.join(config.frontendDir, 'node_modules/react-dom/umd/react-dom.production.min.js')
    };

    for (const [name, src] of Object.entries(files)) {
        await copyFile(src, path.join(config.staticDir, path.basename(src)));
    }
}

async function copyReactFixes() {
    log.info('Copying React fix files...');
    const utilsDir = path.join(config.frontendDir, 'src/utils');
    const fixFiles = [
        'ensure-react-dom.js',
        'ensure-redux-provider.js',
        'ensure-router-provider.js',
        'fallback.js'
    ];

    for (const file of fixFiles) {
        const src = path.join(utilsDir, file);
        const dest = path.join(config.reactFixesDir, file);
        try {
            await fs.access(src);
            await fs.copyFile(src, dest);
            log.success(`Copied ${file}`);
        } catch (error) {
            log.warning(`${file} not found in utils directory`);
        }
    }
}

async function copyAdditionalFixes() {
    log.info('Copying additional React fixes...');
    const additionalFiles = [
        'critical-react-fix.js',
        'runtime-diagnostics.js',
        'react-fallback.js'
    ];

    for (const file of additionalFiles) {
        const src = path.join(config.staticDir, file);
        const dest = path.join(config.reactFixesDir, file);
        try {
            await fs.access(src);
            await fs.copyFile(src, dest);
            log.success(`Copied ${file}`);
        } catch (error) {
            log.warning(`${file} not found in static directory`);
        }
    }
}

async function createConsolidatedFixes() {
    log.info('Creating consolidated fixes file...');
    const content = `// Consolidated React fixes
import './react-fixes/critical-react-fix.js';
import './react-fixes/runtime-diagnostics.js';
import './react-fixes/react-fallback.js';
import './react-fixes/ensure-react-dom.js';
import './react-fixes/ensure-redux-provider.js';
import './react-fixes/ensure-router-provider.js';
import './react-fixes/fallback.js';`;

    const consolidatedPath = path.join(config.staticDir, 'consolidated-fixes.js');
    await fs.writeFile(consolidatedPath, content);

    try {
        await fs.access(config.reactFixesDir);
        await fs.copyFile(consolidatedPath, path.join(config.reactFixesDir, 'consolidated-fixes.js'));
        log.success('Copied consolidated-fixes.js');
    } catch {
        throw new Error('React fixes directory not found');
    }
}

async function build() {
    try {
        await ensureDirectories();
        await runViteBuild();
        await copyBuildFiles();
        await createVersionFile();
        await createBuildInfo();
        await copyReactProductionFiles();
        await copyReactFixes();
        await copyAdditionalFixes();
        await createConsolidatedFixes();
        log.success('Build process completed successfully');
    } catch (error) {
        log.error(`Build failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the build
build();
