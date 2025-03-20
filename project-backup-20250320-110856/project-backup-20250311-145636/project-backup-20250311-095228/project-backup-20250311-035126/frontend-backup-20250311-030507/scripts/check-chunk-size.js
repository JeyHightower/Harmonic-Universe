/**
 * Script to analyze chunk sizes during build
 * This helps identify which chunks are causing size warnings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the dist/assets directory
const assetsDir = path.resolve(__dirname, '../dist/assets');

console.log('====== CHUNK SIZE ANALYSIS ======');
console.log(`Checking assets in: ${assetsDir}`);

if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found: ${assetsDir}`);
    console.log('Please run the build command first.');
    process.exit(1);
}

// Get all files in the assets directory
const files = fs.readdirSync(assetsDir);

// Filter for JS files
const jsFiles = files.filter(file => file.endsWith('.js'));

console.log(`\nFound ${jsFiles.length} JavaScript chunks:`);

// Track stats for reporting
const stats = {
    totalSize: 0,
    largestChunk: {
        name: '',
        size: 0
    },
    chunksOverLimit: [],
    limit: 800 * 1024, // 800KB in bytes (Vite's default warning limit)
};

// Function to convert bytes to KB with 2 decimal places
const toKB = bytes => (bytes / 1024).toFixed(2);

// Analyze each JS file
jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeInBytes = stats.size;
    const sizeInKB = toKB(sizeInBytes);

    console.log(`- ${file}: ${sizeInKB} KB`);

    // Update stats
    stats.totalSize += sizeInBytes;

    if (sizeInBytes > stats.largestChunk.size) {
        stats.largestChunk = {
            name: file,
            size: sizeInBytes
        };
    }

    if (sizeInBytes > stats.limit) {
        stats.chunksOverLimit.push({
            name: file,
            size: sizeInBytes
        });
    }
});

// Print summary
console.log('\n====== SUMMARY ======');
console.log(`Total JS size: ${toKB(stats.totalSize)} KB`);
console.log(`Largest chunk: ${stats.largestChunk.name} (${toKB(stats.largestChunk.size)} KB)`);

if (stats.chunksOverLimit.length > 0) {
    console.log(`\nChunks exceeding warning limit (800KB):`);
    stats.chunksOverLimit.forEach(chunk => {
        console.log(`- ${chunk.name}: ${toKB(chunk.size)} KB (${(chunk.size / stats.limit * 100).toFixed(1)}% of limit)`);
    });

    console.log('\nSUGGESTIONS:');
    console.log('1. Increase chunkSizeWarningLimit in vite.config.js');
    console.log('2. Add more specific manual chunk definitions for problem libraries');
    console.log('3. Consider code-splitting or lazy loading for large components');
} else {
    console.log('\nAll chunks are under the warning limit. No action needed!');
}

console.log('\n====== CONFIGURATION CHECK ======');
console.log('Current vite.config.js has chunkSizeWarningLimit: 1500KB');
console.log('This script used default limit of 800KB for analysis');
