# Handling ES Module Compatibility in Node.js on Render.com

This document explains how to fix ES Module compatibility issues when deploying Node.js applications to Render.com.

## Problem

When deploying to Render.com, you might encounter ES Module compatibility errors:

```
ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and '/opt/render/project/src/frontend/package.json' contains "type": "module".
```

This error occurs because:

1. Your package.json has `"type": "module"` which treats .js files as ES modules
2. ES modules use `import/export` syntax instead of CommonJS `require/module.exports`
3. Mixing the two systems can cause compatibility issues

## Solution

We've implemented a comprehensive approach to handle both module systems:

### 1. Use the Correct File Extensions

- Use `.cjs` extension for CommonJS files
- Use `.mjs` extension for ES Module files
- Or rely on `"type": "module"` in package.json to treat .js as ES modules

### 2. Create Separate Build Scripts for Each Module System

#### CommonJS Script (vite-build.cjs):

```javascript
// CommonJS build script
const path = require('path');
console.log('Starting programmatic Vite build (CommonJS)...');
try {
  // Attempt to require Vite
  const vite = require('vite');
  console.log('Vite module loaded successfully in CommonJS');

  // Run the build
  vite
    .build({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      mode: 'production',
      emptyOutDir: true,
    })
    .catch(err => {
      console.error('Build error:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Failed to load Vite module:', err);
  process.exit(1);
}
```

#### ES Module Script (vite-build.mjs):

```javascript
// ES Module build script
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

console.log('Starting programmatic Vite build (ES Module)...');

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBuild() {
  try {
    // Dynamic import for ES modules
    const vite = await import('vite');
    console.log('Vite module loaded successfully in ES Module');

    // Run the build
    await vite.build({
      configFile: resolve(__dirname, 'vite.config.js'),
      mode: 'production',
      emptyOutDir: true,
    });
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

runBuild();
```

### 3. Run with the Correct Node.js Flags

When running ES modules, use the `--experimental-vm-modules` flag:

```bash
node --experimental-vm-modules vite-build.mjs
```

For CommonJS files:

```bash
node vite-build.cjs
```

### 4. Set the NODE_OPTIONS Environment Variable

```bash
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"
```

## Implementation in Build Scripts

Our enhanced `render-build-command.sh` script includes methods for both module systems:

```bash
# Method 3: CommonJS script approach
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Build Method 3: CommonJS script approach..."
    ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true node vite-build.cjs || echo "Method 3 failed, trying next method..."
fi

# Method 4: ES Module script approach
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Build Method 4: ES Module script approach..."
    ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true node --experimental-vm-modules vite-build.mjs || echo "Method 4 failed, trying next method..."
fi
```

## CommonJS/ES Module Interoperability Tips

### In CommonJS (.cjs) files:

- Use `require()` to import modules
- Use `module.exports` to export
- Access to `__dirname` and `__filename` works natively

### In ES Module (.mjs) files:

- Use `import` for static imports
- Use `import()` for dynamic imports
- Use `export` statements
- No direct access to `__dirname` and `__filename`; use this workaround:

  ```javascript
  import { fileURLToPath } from 'url';
  import { dirname } from 'path';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

- Use `createRequire` for requiring CommonJS modules:

  ```javascript
  import { createRequire } from 'module';
  const require = createRequire(import.meta.url);

  // Now you can use require()
  const someModule = require('some-commonjs-module');
  ```

## Troubleshooting

If you still encounter ES Module compatibility issues:

1. **Check package.json**: Verify if "type": "module" is set
2. **Review file extensions**: Ensure you're using the right extensions (.cjs, .mjs)
3. **Node.js version**: Make sure you're using Node.js 14+ which has better ES module support
4. **Verify imports/exports**: Check that you're using the correct syntax for each module type

## Further Resources

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [Understanding ES Modules in Node.js](https://blog.logrocket.com/how-to-use-ecmascript-modules-with-node-js/)
- [Render.com Node.js Documentation](https://render.com/docs/node-version)
