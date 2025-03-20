#!/usr/bin/env node

/**
 * This script checks for direct imports from '@ant-design/icons'
 * and helps maintain the consistent use of our custom icons implementation.
 *
 * Usage: node scripts/check-icon-imports.js
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the search pattern
const searchPattern = "from '@ant-design/icons'";

// Run the search and process the results
exec(`grep -r "${searchPattern}" --include="*.jsx" --include="*.js" src`,
    { cwd: path.resolve(__dirname, '..') },
    (error, stdout, stderr) => {
        if (stderr) {
            console.error('Error:', stderr);
            process.exit(1);
        }

        if (!stdout.trim()) {
            console.log('✅ No direct imports from @ant-design/icons found!');
            process.exit(0);
        }

        console.log('⚠️ Found direct imports from @ant-design/icons:');
        console.log('-------------------------------------------');

        const lines = stdout.trim().split('\n');

        lines.forEach(line => {
            const [file, match] = line.split(':', 2);
            console.log(`File: ${file}`);
            console.log(`Import: ${match.trim()}`);

            // Generate the fix
            const relativePath = path.relative(path.dirname(file), 'src/components/common');
            const fixedImport = match.replace('@ant-design/icons',
                relativePath.startsWith('.') ? `${relativePath}` : `./${relativePath}`);

            console.log(`Suggested fix: ${fixedImport.trim()}`);
            console.log('-------------------------------------------');
        });

        console.log(`Found ${lines.length} files with direct imports.`);
        console.log('Please replace these imports with imports from our custom icons implementation.');
        console.log('Example:');
        console.log(`  import { UserOutlined } from '@ant-design/icons';`);
        console.log('Should be:');
        console.log(`  import { UserOutlined } from '../relative/path/to/components/common';`);

        process.exit(1);
    }
);
