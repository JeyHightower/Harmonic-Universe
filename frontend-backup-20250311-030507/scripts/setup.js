import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create necessary directories
const dirs = [
    '../static',
    '../static/react-fixes',
    'src/utils'
];

dirs.forEach(dir => {
    const dirPath = resolve(__dirname, dir);
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Create necessary files
const files = {
    '../static/version.js': `export const version = {
        react: '18.2.0',
        build: '${new Date().toISOString()}',
        environment: '${process.env.NODE_ENV || 'production'}'
    };`,
    '../static/build-info.json': JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production'
    }, null, 2),
    '../static/critical-react-fix.js': `import { createElement, Fragment } from 'react';
    if (typeof window !== 'undefined') {
        if (!window.React) window.React = {};
        if (!window.React.createElement) window.React.createElement = createElement;
        if (!window.React.Fragment) window.React.Fragment = Fragment;
    }`,
    '../static/fallback.js': `export const createFallbackComponent = (name, props) => ({
        $$typeof: Symbol.for('react.element'),
        type: 'div',
        props: {
            className: 'react-fallback',
            'data-component': name,
            children: \`Failed to load component: \${name}\`
        },
        key: null,
        ref: null
    });`,
    '../static/react-fallback.js': `export const createFallback = (name) => ({
        Component: () => React.createElement('div', {
            className: 'react-fallback',
            'data-component': name
        }, 'Component Failed to Load: ' + name),
        error: new Error('Component failed to load: ' + name)
    });`,
    '../static/runtime-diagnostics.js': `export const RuntimeDiagnostics = {
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
    }`
};

Object.entries(files).forEach(([file, content]) => {
    const filePath = resolve(__dirname, file);
    writeFileSync(filePath, content);
    console.log(`Created file: ${file}`);
});
