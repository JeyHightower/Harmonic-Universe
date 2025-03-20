#!/usr/bin/env node

/**
 * This script fixes JSX syntax issues in Ant Design icons files
 * by transforming JSX to plain JavaScript function calls.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'glob';
const glob = pkg;

console.log('Fixing JSX syntax in Ant Design icon files...');

// Get the current working directory
const cwd = process.cwd();
console.log(`Current working directory: ${cwd}`);

// Find all Ant Design icon files
const nodeModulesDir = path.join(cwd, 'node_modules/@ant-design/icons/es/icons');
const pattern = path.join(nodeModulesDir, '*.js');
console.log(`Looking for icon files: ${pattern}`);

let iconFiles;
try {
    iconFiles = glob.sync(pattern);
    console.log(`Found ${iconFiles.length} icon files to fix.`);
} catch (error) {
    console.error(`Error finding icon files: ${error.message}`);
    process.exit(1);
}

if (iconFiles.length === 0) {
    console.warn('No Ant Design icon files found.');
    process.exit(0);
}

// Process each icon file
let fixedCount = 0;
let errorCount = 0;

for (const file of iconFiles) {
    try {
        // Read file content
        let content = fs.readFileSync(file, 'utf8');

        // Check if the file contains JSX
        if (content.includes('<AntdIcon')) {
            // Transform JSX to React.createElement calls
            const transformedContent = content.replace(
                /<AntdIcon\s+{\.\.\.props}\s+ref={ref}\s+icon={(\w+)}\s+\/>/g,
                'React.createElement(AntdIcon, Object.assign({}, props, { ref: ref, icon: $1 }))'
            );

            // Write the transformed content back to the file
            fs.writeFileSync(file, transformedContent);
            fixedCount++;

            if (fixedCount % 50 === 0) {
                console.log(`Fixed ${fixedCount} files so far...`);
            }
        }
    } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
        errorCount++;
    }
}

console.log(`
JSX Fix Report:
--------------
Files processed: ${iconFiles.length}
Files fixed:     ${fixedCount}
Errors:          ${errorCount}
`);

if (fixedCount > 0) {
    console.log('✅ Successfully fixed JSX syntax in Ant Design icon files!');
} else {
    console.log('⚠️ No files needed fixing.');
}
