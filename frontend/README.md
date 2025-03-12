# Harmonic Universe Frontend

## Fixing Rollup ESM/CommonJS Import Issues

This project includes scripts to fix the CommonJS vs ES Module import issues in the Rollup module.

### The Issue

The main error encountered was:

```
Named export 'xxhashBase16' not found. The requested module '../../native.js' is a CommonJS module, which may not support all module.exports as named exports.
```

This error occurs because:

1. The Rollup module uses CommonJS format (`module.exports`)
2. But some files are trying to import from it using ES Module named imports (`import { x } from y`)
3. This doesn't work directly because CommonJS modules don't have named exports in the same way ES Modules do

### How to Fix

Run the following scripts to fix the issue:

1. First, patch the Rollup native module:

```bash
chmod +x patch-rollup.sh
./patch-rollup.sh
```

2. Then, fix all problematic imports:

```bash
chmod +x fix-rollup-imports.sh
./fix-rollup-imports.sh
```

3. Finally, build with the environment variables to disable native modules:

```bash
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true npm run build
```

### What the Fix Does

1. Patches the `native.js` module to include all necessary exports
2. Replaces problematic ES Module named imports with the recommended pattern:

   ```javascript
   // Instead of:
   import { parseAsync, xxhashBase16 } from '../../native.js';

   // We use:
   import pkg from '../../native.js';
   const { parseAsync, xxhashBase16 } = pkg;
   ```

3. Creates a minimal Vite configuration that works with the patched modules

### For Deployment

When deploying to platforms like Render.com, make sure to:

1. Set the environment variables:

   ```
   ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
   ROLLUP_NATIVE_PURE_JS=true
   ROLLUP_DISABLE_NATIVE=true
   ```

2. Use the comprehensive build fix script:
   ```bash
   chmod +x fix-build.sh
   ./fix-build.sh
   ```

This will ensure that the build process completes successfully without native module errors.
