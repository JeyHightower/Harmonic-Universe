#!/usr/bin/env node

// This script checks for Vite cache directories but doesn't need to patch anything anymore
// since our handleMissingModulesPlugin in vite.config.js handles all icons dynamically

import fs from 'fs';
import path from 'path';
import pkg from 'glob';
const glob = pkg;

console.log('Checking Vite dependency chunks...');

// Just check if there are any chunk files
const chunkFiles = [
    ...(await glob('node_modules/.vite/deps/chunk-*.js', { silent: true })),
    ...(await glob('.vite-cache/deps/chunk-*.js', { silent: true }))
];

console.log(`Found ${chunkFiles.length} chunk files. No patching needed with current config.`);
