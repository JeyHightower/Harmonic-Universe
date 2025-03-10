// Script to handle Render.com specific build process
// This script skips husky installation and handles any other Render-specific build steps

console.log('📦 Starting Render.com build process for frontend...');

// Set environment variable to skip husky
process.env.RENDER = 'true';

execSync('cd frontend && npm install', { stdio: 'inherit' })

// Make sure to use the correct import format based on your Node.js environment
// If using ES modules (package.json has "type": "module")
import fsExtra from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Determine build paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const staticDir = path.resolve(__dirname, '../../static');

console.log('Copying from:', distDir);
console.log('Copying to:', staticDir);

// Ensure the static directory exists
fsExtra.ensureDirSync(staticDir);

// Copy the built files to the static directory
try {
    if (fsExtra.existsSync(distDir)) {
        fsExtra.copySync(distDir, staticDir, { overwrite: true });
        console.log('Successfully copied build files to static directory');
    } else {
        console.error('Error: Build directory does not exist:', distDir);
        // Create a placeholder file so the build doesn't fail completely
        fsExtra.ensureDirSync(staticDir);
        fsExtra.writeFileSync(
            path.join(staticDir, 'index.html'),
            '<html><body><h1>Build Failed</h1><p>Please check build logs.</p></body></html>'
        );
    }
} catch (error) {
    console.error('Error during copy operation:', error);
    process.exit(1);
}

// Utility functions
const log = {
    info: (msg) => console.log(`\x1b[36m[Build]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[Build]\x1b[0m ${msg}`),
    warning: (msg) => console.log(`\x1b[33m[Build]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[Build Error]\x1b[0m ${msg}`)
};

async function ensureDirectories() {
    log.info('Creating necessary directories...');
    await fsExtra.ensureDir(staticDir);
    await fsExtra.ensureDir(path.resolve(__dirname, '../static/react-fixes'));
}

async function runViteBuild() {
    log.info('Running Vite build...');
    try {
        process.chdir(path.resolve(__dirname, '..'));
        execSync('npm run vite build', { stdio: 'inherit' });
    } catch (error) {
        log.error('Vite build failed');
        throw error;
    }
}

async function createVersionFile() {
    log.info('Creating version.js...');
    const content = `window.BUILD_VERSION = '${Date.now()}';`;
    await fsExtra.writeFile(path.join(staticDir, 'version.js'), content);
}

async function createBuildInfo() {
    log.info('Creating build-info.json...');
    const buildInfo = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production'
    };
    await fsExtra.writeJson(path.join(staticDir, 'build-info.json'), buildInfo, { spaces: 4 });
}

async function copyReactProductionFiles() {
    log.info('Copying React production files...');
    const files = {
        react: path.join(__dirname, '../node_modules/react/umd/react.production.min.js'),
        reactDom: path.join(__dirname, '../node_modules/react-dom/umd/react-dom.production.min.js')
    };

    for (const [name, src] of Object.entries(files)) {
        try {
            await fsExtra.copy(src, path.join(staticDir, path.basename(src)));
            log.success(`Copied ${path.basename(src)}`);
        } catch (error) {
            log.warning(`Could not copy ${name}: ${error.message}`);
        }
    }
}

async function copyReactFixes() {
    log.info('Copying React fix files...');
    const utilsDir = path.join(__dirname, '../src/utils');
    const fixFiles = [
        'ensure-react-dom.js',
        'ensure-redux-provider.js',
        'ensure-router-provider.js',
        'fallback.js'
    ];

    for (const file of fixFiles) {
        const src = path.join(utilsDir, file);
        const dest = path.join(staticDir, 'react-fixes', file);
        try {
            if (await fsExtra.pathExists(src)) {
                await fsExtra.copy(src, dest);
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
        const src = path.join(staticDir, file);
        const dest = path.join(staticDir, 'react-fixes', file);
        try {
            if (await fsExtra.pathExists(src)) {
                await fsExtra.copy(src, dest);
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

    const consolidatedPath = path.join(staticDir, 'consolidated-fixes.js');
    await fsExtra.writeFile(consolidatedPath, content);

    // Copy to react-fixes directory
    if (await fsExtra.pathExists(path.join(staticDir, 'react-fixes'))) {
        await fsExtra.copy(consolidatedPath, path.join(staticDir, 'react-fixes', 'consolidated-fixes.js'));
        log.success('Copied consolidated-fixes.js');
    } else {
        throw new Error('React fixes directory not found');
    }
}

async function build() {
    try {
        await ensureDirectories();
        await runViteBuild();
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
