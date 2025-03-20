const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check Node.js version
console.log(`Node.js version: ${process.version}`);

// Check npm version
try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`npm version: ${npmVersion}`);
} catch (error) {
    console.error('Error checking npm version:', error.message);
}

// Ensure package.json exists
const packageJsonPath = path.resolve(__dirname, '../package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found!');
    process.exit(1);
}

// Check package.json content
try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    console.log('DevDependencies:', Object.keys(packageJson.devDependencies || {}).length);
} catch (error) {
    console.error('Error reading package.json:', error.message);
}

// Clean node_modules and reinstall
try {
    console.log('Cleaning node_modules...');
    // Using rimraf for cross-platform compatibility
    execSync('npx rimraf node_modules', { stdio: 'inherit' });

    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Ensure Vite is installed
    console.log('Ensuring Vite is installed...');
    execSync('npm install --save-dev vite @vitejs/plugin-react', { stdio: 'inherit' });

    // Run Vite build with --debug flag
    console.log('Running Vite build with verbose logging...');
    execSync('npx vite build --debug', { stdio: 'inherit' });

    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
