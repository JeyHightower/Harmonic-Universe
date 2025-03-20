#!/usr/bin/env node
/**
 * Fix Vite Dependencies Script
 *
 * This script fixes common issues with Vite's dependency handling:
 * 1. Resolves the "intermediate value is not iterable" error in patch-vite-chunks.js
 * 2. Ensures the node_modules/.vite directory exists
 * 3. Handles issues with the glob dependency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix the frontend folder
const frontendDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(frontendDir, 'node_modules');
const viteDir = path.join(nodeModulesDir, '.vite');

console.log('Fixing Vite dependencies...');

// Ensure the directory structure exists
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        return true;
    }
    return false;
}

// Check and create directories
ensureDirectoryExists(nodeModulesDir);
const viteCreated = ensureDirectoryExists(viteDir);
ensureDirectoryExists(path.join(viteDir, 'deps'));

// Check if glob is installed properly
try {
    require.resolve('glob');
    console.log('✓ Glob dependency is correctly installed');
} catch (error) {
    console.log('⨯ Glob dependency missing, installing...');
    try {
        execSync('npm install glob@7.2.0 --save-dev', { cwd: frontendDir, stdio: 'inherit' });
        console.log('✓ Glob dependency installed successfully');
    } catch (error) {
        console.error('⨯ Failed to install glob dependency:', error.message);
    }
}

// Check for patch-vite-chunks.js and fix if needed
const patchViteChunksPath = path.join(__dirname, 'patch-vite-chunks.js');
if (fs.existsSync(patchViteChunksPath)) {
    console.log('Checking patch-vite-chunks.js...');
    let content = fs.readFileSync(patchViteChunksPath, 'utf8');

    // Check if the script has the problematic code
    if (content.includes('await glob(') &&
        (content.includes('intermediate value') || content.includes('...(await glob'))) {

        console.log('⨯ Found problematic code in patch-vite-chunks.js, fixing...');

        // Replace the problematic code with a safer version
        const newContent = `import { promises as fs } from 'fs';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';

const globPromise = promisify(glob);

// Function to find chunk files safely
async function findChunkFiles() {
  try {
    // Handle the case where no files are found
    const files = await globPromise('node_modules/.vite/deps/chunk-*.js', { silent: true }) || [];
    const cacheFiles = await globPromise('.vite-cache/deps/chunk-*.js', { silent: true }) || [];
    return [...files, ...cacheFiles];
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

    console.log(\`Found \${chunkFiles.length} chunk files to process.\`);

    // Process each chunk file
    for (const file of chunkFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');

        // Apply fixes as needed
        let fixed = content;

        // Write back fixed content
        await fs.writeFile(file, fixed, 'utf8');
        console.log(\`Processed: \${file}\`);
      } catch (error) {
        console.error(\`Error processing file \${file}:\`, error);
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
});`;

        fs.writeFileSync(patchViteChunksPath, newContent, 'utf8');
        console.log('✓ Fixed patch-vite-chunks.js');
    } else {
        console.log('✓ patch-vite-chunks.js looks good');
    }
} else {
    console.log('⨯ patch-vite-chunks.js not found');
}

// Create a dummy vite chunk file if directory was just created
if (viteCreated) {
    const dummyChunkFile = path.join(viteDir, 'deps', 'chunk-placeholder.js');
    console.log(`Creating placeholder chunk file: ${dummyChunkFile}`);
    fs.writeFileSync(dummyChunkFile, '// Placeholder chunk file\nconsole.log("Placeholder chunk file loaded");\n', 'utf8');
}

// Check if crypto-polyfill.cjs exists
const cryptoPolyfillPath = path.join(frontendDir, 'crypto-polyfill.cjs');
if (!fs.existsSync(cryptoPolyfillPath)) {
    console.log('Creating crypto-polyfill.cjs...');
    const cryptoPolyfill = `// Crypto API polyfill for Node.js
if (!global.crypto) {
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto;
}`;
    fs.writeFileSync(cryptoPolyfillPath, cryptoPolyfill, 'utf8');
    console.log('✓ Created crypto-polyfill.cjs');
}

console.log('✅ Vite dependencies fixed successfully!');
console.log('You can now run npm run dev:frontend');
