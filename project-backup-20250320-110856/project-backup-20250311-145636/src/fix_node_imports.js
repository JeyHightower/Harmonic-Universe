#!/usr/bin/env node
/**
 * fix_node_imports.js - Fix ES modules imports in Node.js scripts
 *
 * This script checks for ES module syntax in JS files and rewrites imports
 * to ensure they work with Node.js. It specifically addresses the 'glob' import issue.
 */

const fs = require('fs');
const path = require('path');

console.log('Starting fix_node_imports.js...');

// Script paths to check
const scriptsToCheck = [
    'frontend/scripts/clean-ant-icons.js',
    // Add other problematic scripts here
];

// Helper function to check and fix a file
function fixFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return false;
    }

    console.log(`Checking file: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check for ES module import of glob
    if (content.includes('import glob from') || content.includes("import glob from 'glob'") || content.includes('import glob from "glob"')) {
        console.log(`  Found ES module import of glob in ${filePath}`);

        // Replace with CommonJS require
        content = content.replace(/import glob from ['"]glob['"];?/g, "const glob = require('glob');");
        modified = true;
    }

    // Check for other ES module imports and fix them
    const importRegex = /import\s+(\S+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const importName = match[1];
        const importPath = match[2];

        console.log(`  Found ES module import: ${importName} from ${importPath}`);

        // Don't replace the glob import again
        if (importPath !== 'glob') {
            const replacement = `const ${importName} = require('${importPath}');`;
            content = content.replace(match[0], replacement);
            modified = true;
        }
    }

    // If file was modified, write back the changes
    if (modified) {
        console.log(`  Modifying file: ${filePath}`);
        fs.writeFileSync(filePath, content);
        return true;
    } else {
        console.log(`  No changes needed for: ${filePath}`);
        return false;
    }
}

// Process each script
let fixedCount = 0;
for (const scriptPath of scriptsToCheck) {
    if (fixFile(scriptPath)) {
        fixedCount++;
    }
}

console.log(`Processed ${scriptsToCheck.length} files, fixed ${fixedCount}`);

// Check if we need to create a package.json for the scripts directory
const scriptsDir = 'frontend/scripts';
if (fs.existsSync(scriptsDir) && !fs.existsSync(path.join(scriptsDir, 'package.json'))) {
    console.log(`Creating package.json in ${scriptsDir}`);

    const packageJson = {
        "name": "scripts",
        "version": "1.0.0",
        "description": "Build scripts",
        "dependencies": {
            "glob": "^8.0.3",
            "rimraf": "^3.0.2"
        }
    };

    fs.writeFileSync(
        path.join(scriptsDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
}

console.log('fix_node_imports.js completed');
