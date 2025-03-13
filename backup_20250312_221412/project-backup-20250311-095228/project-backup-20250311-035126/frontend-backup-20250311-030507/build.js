const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const distDir = path.join(__dirname, 'dist');
const staticDir = path.join(__dirname, '..', 'static');

// Ensure directories exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
}

// Run Vite build
console.log('Building frontend with Vite...');
try {
    execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
    console.log('Frontend build completed successfully');
} catch (error) {
    console.error('Frontend build failed:', error);
    process.exit(1);
}

// Copy build to static directory
console.log('Copying frontend build to static directory...');
try {
    if (process.platform === 'win32') {
        execSync(`xcopy "${distDir}\\*" "${staticDir}\\" /E /Y`);
    } else {
        execSync(`cp -R ${distDir}/* ${staticDir}/`);
    }
    console.log('Files copied successfully');
} catch (error) {
    console.error('Failed to copy files:', error);
    process.exit(1);
}
