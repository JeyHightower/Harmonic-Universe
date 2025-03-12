#!/usr/bin/env node

/**
 * Script to run the frontend in development mode with settings that mimic Render.com
 * This helps catch deployment-specific issues during development
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_DIR = path.resolve(__dirname, '..');
const ENV_VARIABLES = {
    VITE_API_BASE_URL: 'http://localhost:5001', // Local backend URL
    VITE_RENDER_ENV: 'development',
    VITE_SIMULATE_PROD: 'true'
};

console.log('🚀 Starting development server with Render.com-like settings...');

// Set environment variables
Object.entries(ENV_VARIABLES).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`📝 Set ${key}=${value}`);
});

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

try {
    // First check if vite is installed
    console.log('🔍 Checking for Vite...');
    try {
        execSync('npm list vite', { cwd: FRONTEND_DIR, stdio: 'ignore' });
    } catch (error) {
        console.log('⚠️ Vite not found in dependencies, installing...');
        runCommand('npm install vite@latest @vitejs/plugin-react --save-dev');
    }

    // Start the dev server
    console.log('🌐 Starting development server...');
    runCommand('npm run dev');
} catch (error) {
    console.error('\n❌ Failed to start development server:');
    console.error(error);
    process.exit(1);
}
