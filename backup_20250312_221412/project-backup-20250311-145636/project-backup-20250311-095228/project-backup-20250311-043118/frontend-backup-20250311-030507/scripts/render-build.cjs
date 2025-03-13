// Script to handle Render.com specific build process
// This script skips husky installation and handles any other Render-specific build steps

console.log('📦 Starting Render.com build process for frontend...');

// Set environment variable to skip husky
process.env.RENDER = 'true';

// Run the normal build process
const { execSync } = require('child_process');

try {
    console.log('🛠️ Building frontend application...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Frontend build completed successfully!');
} catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    process.exit(1);
}
