// Script to verify deployment setup
// Run this locally to make sure your deployment settings are correct

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file info for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying frontend deployment setup...');

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found!');
    process.exit(1);
}

// Check if husky is properly configured
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (!packageJson.scripts.prepare || !packageJson.scripts.prepare.includes('process.env.CI')) {
    console.warn('⚠️ Husky prepare script is not configured to handle CI environments!');
}

// Verify build scripts
if (!packageJson.scripts.build) {
    console.error('❌ build script not found in package.json!');
    process.exit(1);
}

// Check if all required script files exist
const requiredScripts = [
    'scripts/clean-index.js',
    'scripts/clean-ant-icons.js',
    'scripts/fix-ant-icons.js',
    'scripts/ensure-react-deps.js',
    'scripts/patch-ant-icons.js',
    'scripts/patch-ant-icons-inline.js',
    'scripts/check-ant-icons-files.js',
    'scripts/render-post-build.js',
    'scripts/render-build.js'
];

for (const script of requiredScripts) {
    if (!fs.existsSync(path.join(__dirname, script))) {
        console.error(`❌ Required script ${script} not found!`);
        process.exit(1);
    }
}

console.log('✅ All required script files found');

// Simulate CI environment build
console.log('🧪 Testing build in CI environment simulation...');
try {
    execSync('RENDER=true npm run build --dry-run', { stdio: 'inherit' });
    console.log('✅ CI build simulation successful!');
} catch (error) {
    console.error('❌ CI build simulation failed:', error.message);
    process.exit(1);
}

console.log('✅ Frontend deployment setup verified successfully!');
console.log('🚀 Recommendation for Render.com:');
console.log('   - Build command: cd frontend && RENDER=true npm install && node scripts/render-build.js');
console.log('   - Make sure RENDER=true is set in your environment variables');
