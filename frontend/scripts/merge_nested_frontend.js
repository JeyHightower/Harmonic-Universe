#!/usr/bin/env node

/**
 * This script merges the nested frontend/frontend directory structure into the parent.
 * It moves files from the nested directory to the parent if they don't already exist.
 *
 * Usage: node scripts/merge_nested_frontend.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define paths
const nestedFrontendDir = path.join(rootDir, 'frontend');
const nestedSrcDir = path.join(nestedFrontendDir, 'src');

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function copyDirectory(source, destination) {
    try {
        const entries = await fs.readdir(source, { withFileTypes: true });

        // Create destination directory if it doesn't exist
        if (!(await fileExists(destination))) {
            await fs.mkdir(destination, { recursive: true });
            console.log(`Created directory: ${destination}`);
        }

        for (const entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);

            if (entry.isDirectory()) {
                // Recursively copy directory
                await copyDirectory(srcPath, destPath);
            } else {
                // Check if file already exists in destination
                if (await fileExists(destPath)) {
                    console.log(`File already exists (skipping): ${destPath}`);
                } else {
                    // Copy file
                    await fs.copyFile(srcPath, destPath);
                    console.log(`Copied file: ${destPath}`);
                }
            }
        }
    } catch (error) {
        console.error(`Error copying directory from ${source} to ${destination}:`, error);
    }
}

async function main() {
    try {
        // Check if nested frontend directory exists
        if (!(await fileExists(nestedFrontendDir))) {
            console.log('No nested frontend directory found. Nothing to merge.');
            return;
        }

        console.log('Starting merge of nested frontend directory...');

        // Copy files from nested src to parent src
        if (await fileExists(nestedSrcDir)) {
            await copyDirectory(nestedSrcDir, path.join(rootDir, 'src'));
        }

        console.log('\nMerge completed successfully!');
        console.log('\nIMPORTANT: Please review the changes and verify that everything works correctly.');
        console.log('After verification, you can manually remove the nested frontend directory:');
        console.log(`rm -rf "${nestedFrontendDir}"\n`);

    } catch (error) {
        console.error('Error merging directories:', error);
    }
}

main();
