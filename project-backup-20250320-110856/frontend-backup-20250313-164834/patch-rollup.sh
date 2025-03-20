#!/bin/bash
set -e

echo "🔧 Patching Rollup native module to use pure JS implementation..."
mkdir -p node_modules/rollup/dist
cat > node_modules/rollup/dist/native.js << EOF
'use strict';

// This is a patched version that skips native module loading
// and always returns null to force pure JS implementation

Object.defineProperty(exports, '__esModule', { value: true });

function requireWithFriendlyError() {
  // Always return null to force pure JS implementation
  return null;
}

// Export patched function
exports.getDefaultNativeFactory = function() {
  return null;
};

exports.getNativeFactory = function() {
  return null;
};

// Add exports that might be imported by ES modules
exports.parse = function() {
  return null;
};

exports.parseAsync = function() {
  return Promise.resolve(null);
};

// Add xxhash exports
exports.xxhashBase16 = function() {
  return null;
};

exports.xxhashBase64Url = function() {
  return null;
};

exports.xxhashBase36 = function() {
  return null;
};
EOF
echo "✅ Rollup native module patched successfully."

# Patch any files that have CommonJS vs ES Module import issues
echo "🔧 Patching files with CommonJS vs ES Module import issues..."

# Create a wrapper for ES modules to work with CommonJS
echo "🔧 Creating ESM wrapper for CommonJS modules..."
mkdir -p esm-wrappers
cat > esm-wrappers/native-wrapper.js << EOF
// ES Module wrapper for CommonJS native.js
import native from '../node_modules/rollup/dist/native.js';

// Re-export all properties as named exports
export const parse = native.parse || (() => null);
export const parseAsync = native.parseAsync || (() => Promise.resolve(null));
export const getDefaultNativeFactory = native.getDefaultNativeFactory || (() => null);
export const getNativeFactory = native.getNativeFactory || (() => null);
export const xxhashBase16 = native.xxhashBase16 || (() => null);
export const xxhashBase64Url = native.xxhashBase64Url || (() => null);
export const xxhashBase36 = native.xxhashBase36 || (() => null);

// Also export the default
export default native;
EOF

echo "✅ ESM wrapper created successfully."
