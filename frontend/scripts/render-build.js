// Script to handle Render.com specific build process
// This script skips husky installation and handles any other Render-specific build steps

console.log('📦 Starting Render.com build process for frontend...');

// Set environment variable to skip husky
process.env.RENDER = 'true';

execSync('cd frontend && npm install', { stdio: 'inherit' })
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// Utility functions
const log = {
    info: (msg) => console.log(`\x1b[36m[Build]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[Build]\x1b[0m ${msg}`),
    warning: (msg) => console.log(`\x1b[33m[Build]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[Build Error]\x1b[0m ${msg}`)
};

async function ensureDirectories() {
    log.info('Creating necessary directories...');
    await fs.ensureDir(config.staticDir);
    await fs.ensureDir(config.reactFixesDir);
}

async function runViteBuild() {
    log.info('Running Vite build...');
    try {
        process.chdir(config.frontendDir);
        execSync('npm run vite build', { stdio: 'inherit' });
    } catch (error) {
        log.error('Vite build failed');
        throw error;
    }
}

async function copyBuildFiles() {
    log.info('Copying build files...');
    if (!await fs.pathExists(config.distDir)) {
        throw new Error('Build failed - dist directory not created');
    }
    await fs.copy(config.distDir, config.staticDir, { overwrite: true });
}

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
    await fs.writeJson(path.join(config.staticDir, 'build-info.json'), buildInfo, { spaces: 4 });
}

async function copyReactProductionFiles() {
    log.info('Copying React production files...');
    const files = {
        react: path.join(config.frontendDir, 'node_modules/react/umd/react.production.min.js'),
        reactDom: path.join(config.frontendDir, 'node_modules/react-dom/umd/react-dom.production.min.js')
    };

    for (const [name, src] of Object.entries(files)) {
        try {
            await fs.copy(src, path.join(config.staticDir, path.basename(src)));
            log.success(`Copied ${path.basename(src)}`);
        } catch (error) {
            log.warning(`Could not copy ${name}: ${error.message}`);
        }
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
            if (await fs.pathExists(src)) {
                await fs.copy(src, dest);
                log.success(`Copied ${file}`);
            } else {
                log.warning(`${file} not found in utils directory`);
            }
        } catch (error) {
            log.warning(`Error copying ${file}: ${error.message}`);
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
            if (await fs.pathExists(src)) {
                await fs.copy(src, dest);
                log.success(`Copied ${file}`);
            } else {
                log.warning(`${file} not found in static directory`);
            }
        } catch (error) {
            log.warning(`Error copying ${file}: ${error.message}`);
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

    // Copy to react-fixes directory
    if (await fs.pathExists(config.reactFixesDir)) {
        await fs.copy(consolidatedPath, path.join(config.reactFixesDir, 'consolidated-fixes.js'));
        log.success('Copied consolidated-fixes.js');
    } else {
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
