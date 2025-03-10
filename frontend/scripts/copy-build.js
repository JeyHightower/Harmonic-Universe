import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '../dist');
const targetDir = path.join(__dirname, '../../backend/public');

try {
    // Remove existing files in target directory
    await fs.emptyDir(targetDir);

    // Copy new build files
    await fs.copy(buildDir, targetDir);
    console.log('Successfully copied build files to backend/public');
} catch (err) {
    console.error('Error copying build files:', err);
    process.exit(1);
}
