import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../dist');
const destDir = path.join(__dirname, '../../static');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy function that handles both files and directories
function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        try {
            fs.copyFileSync(src, dest);
            console.log(`Copied: ${path.basename(src)}`);
        } catch (error) {
            console.error(`Error copying ${src}: ${error.message}`);
        }
    }
}

console.log('Starting build copy process...');

try {
    // Copy the entire dist directory to static
    copyRecursive(srcDir, destDir);
    console.log('Build copy completed successfully!');
} catch (error) {
    console.error('Error during build copy:', error);
    process.exit(1);
}
