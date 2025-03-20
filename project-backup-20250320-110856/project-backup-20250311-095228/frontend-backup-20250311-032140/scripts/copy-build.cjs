const fs = require('fs-extra');
const path = require('path');

const buildDir = path.join(__dirname, '../dist');
const targetDir = path.join(__dirname, '../../backend/public');

try {
    // Remove existing files in target directory
    fs.emptyDirSync(targetDir);

    // Copy new build files
    fs.copySync(buildDir, targetDir);
    console.log('Successfully copied build files to backend/public');
} catch (err) {
    console.error('Error copying build files:', err);
    process.exit(1);
}
