#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory and node_modules directory
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.resolve(rootDir, 'node_modules');

console.log('Cleaning Ant Design icon files...');

// Find all icon files
const iconFiles = glob.sync(path.join(nodeModulesDir, '@ant-design/icons/es/icons/*.js'));
console.log(`Found ${iconFiles.length} icon files to check.`);

let cleanedCount = 0;
let errorCount = 0;

// Process each icon file
for (const filePath of iconFiles) {
    // Get the file name without extension
    const fileName = path.basename(filePath, '.js');

    // Skip the index.js file completely
    if (fileName === 'index') {
        console.log(`  Skipping index.js file`);
        continue;
    }

    try {
        console.log(`  Cleaning file: ${fileName}`);

        // Read the file content
        const content = fs.readFileSync(filePath, 'utf8');

        // Remove any existing SVG declarations with a more comprehensive regex
        // This will catch declarations with different comment styles and variable names
        const svgRegex = /(\/\*.*?\*\/\s*|\/\/.*?\n\s*)?var\s+\w+Svg\s*=\s*{[\s\S]*?};|\/\/\s*Added by fix-ant-icons\.js[\s\S]*?};|const\s+\w+Svg\s*=\s*{[\s\S]*?};/g;
        const cleanedContent = content.replace(svgRegex, '// Removed SVG declaration\n');

        // Write the cleaned content back to the file
        fs.writeFileSync(filePath, cleanedContent);

        cleanedCount++;
    } catch (error) {
        console.error(`  Error cleaning ${fileName}: ${error.message}`);
        errorCount++;
    }
}

// Print summary report
console.log('\nClean Ant Design Icons Report:');
console.log('----------------------------');
console.log(`Files checked:   ${iconFiles.length}`);
console.log(`Files cleaned:   ${cleanedCount}`);
console.log(`Errors:          ${errorCount}`);

if (errorCount === 0) {
    console.log('\n✅ Successfully cleaned Ant Design icon files!');
} else {
    console.log('\n❌ Completed with errors. Check the logs above for details.');
}
