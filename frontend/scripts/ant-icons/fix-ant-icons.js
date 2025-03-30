#!/usr/bin/env node

/**
 * This script fixes @ant-design/icons import issues
 * by directly modifying problematic imports in node_modules
 */

import fs from 'fs';
import pkg from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
const { glob } = pkg;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory and node_modules directory
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.resolve(rootDir, 'node_modules');

console.log('Fixing Ant Design icon imports...');

// Find all icon files
const iconFiles = glob.sync(path.join(nodeModulesDir, '@ant-design/icons/es/icons/*.js'));
console.log(`Found ${iconFiles.length} icon files to check.`);

let fixedCount = 0;
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
        console.log(`  Fixing icon: ${fileName}`);

        // Read the file content
        const content = fs.readFileSync(filePath, 'utf8');

        // Determine the theme based on the file name
        let theme = 'outlined'; // default theme
        if (fileName.includes('Filled')) {
            theme = 'filled';
        } else if (fileName.includes('TwoTone')) {
            theme = 'twotone';
        }

        // Create the SVG declaration
        const svgDeclaration = `
// Added by fix-ant-icons.js
const ${fileName}Svg = {
  name: '${fileName}',
  theme: '${theme}',
  icon: {
    tag: 'svg',
    attrs: { viewBox: '64 64 896 896' },
    children: []
  }
};
`;

        // Find the position to insert the SVG declaration (after the last import)
        const lastImportIndex = content.lastIndexOf('import');
        const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;

        // Insert the SVG declaration after the last import
        const newContent = content.slice(0, lastImportEndIndex) +
            svgDeclaration +
            content.slice(lastImportEndIndex);

        // Write the updated content back to the file
        fs.writeFileSync(filePath, newContent);

        fixedCount++;
    } catch (error) {
        console.error(`  Error fixing ${fileName}: ${error.message}`);
        errorCount++;
    }
}

// Print summary report
console.log('\nFix Ant Design Icons Report:');
console.log('----------------------------');
console.log(`Files checked:   ${iconFiles.length}`);
console.log(`Files fixed:     ${fixedCount}`);
console.log(`Errors:          ${errorCount}`);

if (errorCount === 0) {
    console.log('\n✅ Successfully fixed Ant Design icon imports!');
} else {
    console.log('\n❌ Completed with errors. Check the logs above for details.');
}
