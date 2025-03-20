#!/usr/bin/env node

// Import the CommonJS module correctly in ES module context
import pkg from 'glob';
const { glob } = pkg;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// In ES modules, __dirname is not available directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

        // First remove the import statement for the SVG
        const importRegex = /import\s+\w+Svg\s+from\s+["']@ant-design\/icons-svg\/es\/asn\/[^"']+["'];?\n?/g;
        let cleanedContent = content.replace(importRegex, '// Removed SVG import\n');

        // Then remove any existing SVG declarations with a comprehensive regex
        // This will catch declarations with different comment styles and variable names
        const svgRegex = /(\/\*.*?\*\/\s*|\/\/.*?\n\s*)?var\s+\w+Svg\s*=\s*{[\s\S]*?};|\/\/\s*Added by fix-ant-icons\.js[\s\S]*?};|const\s+\w+Svg\s*=\s*{[\s\S]*?};/g;
        cleanedContent = cleanedContent.replace(svgRegex, '// Removed SVG declaration\n');

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
