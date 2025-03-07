#!/usr/bin/env node

// This script checks for Vite cache directories but doesn't need to patch anything anymore
// since our handleMissingModulesPlugin in vite.config.js handles all icons dynamically

import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';

const globPromise = promisify(glob);

// Function to find chunk files safely
async function findChunkFiles() {
    try {
        // Handle the case where no files are found
        const files = await globPromise('node_modules/.vite/deps/chunk-*.js', { silent: true });
        return files || []; // Return empty array if null or undefined
    } catch (error) {
        console.error('Error finding chunk files:', error);
        return []; // Return empty array on error
    }
}

async function main() {
    try {
        console.log('Checking Vite dependency chunks...');

        // Get all chunks files safely
        const chunkFiles = await findChunkFiles();

        if (chunkFiles.length === 0) {
            console.log('No chunk files found, nothing to patch.');
            return;
        }

        console.log(`Found ${chunkFiles.length} chunk files to process.`);

        // Process each chunk file
        for (const file of chunkFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');

                // Apply fixes as needed
                let fixed = content;

                // Write back fixed content
                await fs.writeFile(file, fixed, 'utf8');
                console.log(`Processed: ${file}`);
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }

        console.log('Chunk patching completed.');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

main().catch(error => {
    console.error('Fatal error in patch-vite-chunks.js:', error);
    process.exit(1);
});
