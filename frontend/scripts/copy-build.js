import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyDirectory(source, destination) {
    // Create destination directory if it doesn't exist
    if (!existsSync(destination)) {
        mkdirSync(destination, { recursive: true });
    }

    // Read source directory
    const files = readdirSync(source);

    // Copy each file/directory
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

// Copy build files
console.log('Copying build files from dist to static directory...');
copyDirectory(distDir, staticDir);
console.log('Build files copied successfully!');

// Create React fixes directory
const reactFixesDir = join(staticDir, 'react-fixes');
mkdirSync(reactFixesDir, { recursive: true });

// Copy React fixes
console.log('Setting up React fixes...');
const utilsDir = resolve(__dirname, '../src/utils');
const fixesFiles = [
    'ensure-react-dom.js',
    'ensure-redux-provider.js',
    'ensure-router-provider.js',
    'react-diagnostics.js'
].map(file => join(utilsDir, file));

for (const file of fixesFiles) {
    try {
        if (existsSync(file) && statSync(file).isFile()) {
            const destFile = join(reactFixesDir, file.split('/').pop());
            copyFileSync(file, destFile);
            console.log(`Copied ${file} to ${destFile}`);
        }
    } catch (err) {
        console.warn(`Warning: Could not copy ${file}: ${err.message}`);
    }
}

console.log('Build copy process completed successfully');
