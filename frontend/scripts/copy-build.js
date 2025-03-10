import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function ensureDirectoryExists(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

function copyDirectory(source, destination) {
    ensureDirectoryExists(destination);
    const files = readdirSync(source);

    files.forEach(file => {
        const sourcePath = join(source, file);
        const destPath = join(destination, file);

        const stats = statSync(sourcePath);
        if (stats.isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            copyFileSync(sourcePath, destPath);
        }
    });
}

// Paths
const distDir = resolve(__dirname, '../dist');
const staticDir = resolve(__dirname, '../../static');
const utilsDir = resolve(__dirname, '../src/utils');

// Ensure directories exist
ensureDirectoryExists(staticDir);

// Copy build files
console.log('Copying build files from dist to static directory...');
if (existsSync(distDir)) {
    copyDirectory(distDir, staticDir);
    console.log('Build files copied successfully!');
} else {
    console.warn('Warning: dist directory not found');
}

// Create version.js
console.log('Creating version.js...');
const versionContent = `export const version = {
    react: '18.2.0',
    build: '${new Date().toISOString()}',
    environment: '${process.env.NODE_ENV || 'production'}'
};`;
writeFileSync(join(staticDir, 'version.js'), versionContent);

// Create build-info.json
console.log('Creating build-info.json...');
const buildInfo = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
};
writeFileSync(join(staticDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

// Create fallback.js
console.log('Creating fallback.js...');
const fallbackContent = `export const createFallbackComponent = (name, props) => ({
    $$typeof: Symbol.for('react.element'),
    type: 'div',
    props: {
        className: 'react-fallback',
        'data-component': name,
        children: \`Failed to load component: \${name}\`
    },
    key: null,
    ref: null
});`;
writeFileSync(join(staticDir, 'fallback.js'), fallbackContent);

// Create react-fallback.js
console.log('Creating react-fallback.js...');
const reactFallbackContent = `export const createFallback = (name) => ({
    Component: () => React.createElement('div', {
        className: 'react-fallback',
        'data-component': name
    }, 'Component Failed to Load: ' + name),
    error: new Error('Component failed to load: ' + name)
});`;
writeFileSync(join(staticDir, 'react-fallback.js'), reactFallbackContent);

// Create critical-react-fix.js
console.log('Creating critical-react-fix.js...');
const criticalFixContent = `import { createElement, Fragment } from 'react';

if (typeof window !== 'undefined') {
    if (!window.React) window.React = {};
    if (!window.React.createElement) window.React.createElement = createElement;
    if (!window.React.Fragment) window.React.Fragment = Fragment;
}`;
writeFileSync(join(staticDir, 'critical-react-fix.js'), criticalFixContent);

// Create runtime-diagnostics.js
console.log('Creating runtime-diagnostics.js...');
const runtimeDiagnosticsContent = `export const RuntimeDiagnostics = {
    errors: new Set(),
    warnings: new Set(),
    info: new Set(),

    addError: (error) => {
        RuntimeDiagnostics.errors.add({
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack
        });
    },

    getReport: () => ({
        errors: Array.from(RuntimeDiagnostics.errors),
        warnings: Array.from(RuntimeDiagnostics.warnings),
        info: Array.from(RuntimeDiagnostics.info)
    })
};

if (typeof window !== 'undefined') {
    window.__REACT_DIAGNOSTICS__ = RuntimeDiagnostics;
}`;
writeFileSync(join(staticDir, 'runtime-diagnostics.js'), runtimeDiagnosticsContent);

console.log('Build copy process completed successfully');
