import { defineConfig } from "vite";
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import path from 'path';
import { resolve } from 'path';

// Try to import React plugin with fallback to our custom shim
let reactPlugin;
try {
  reactPlugin = require('@vitejs/plugin-react');
} catch (e) {
  console.warn('Failed to load @vitejs/plugin-react, using fallback shim');
  reactPlugin = () => ({
    name: 'vite-react-shim',
    config() {
      return {
        esbuild: {
          jsx: 'automatic',
          // Don't inject React import as it's causing duplication issues
          // jsxInject: `import React from 'react'`
        }
      };
    }
  });
}

// Try to import or create prop-types resolver plugin
let propTypesResolver;
try {
  propTypesResolver = require('./vite-plugin-prop-types').default;
} catch (e) {
  console.warn('Failed to load prop-types resolver plugin, using inline definition');
  propTypesResolver = () => ({
    name: 'inline-prop-types-resolver',
    resolveId(id) {
      if (id === 'prop-types') {
        return '\0prop-types-resolved';
      }
      return null;
    },
    load(id) {
      if (id === '\0prop-types-resolved') {
        return `
          // Simple prop-types shim
          const PropTypes = {
            array: () => null,
            bool: () => null,
            func: () => null,
            number: () => null,
            object: () => null,
            string: () => null,
            node: () => null,
            element: () => null,
            any: () => null,
            arrayOf: () => PropTypes,
            objectOf: () => PropTypes,
            oneOf: () => PropTypes,
            oneOfType: () => PropTypes,
            shape: () => PropTypes,
            exact: () => PropTypes,
          };
          
          // Add isRequired to all types
          Object.keys(PropTypes).forEach(key => {
            if (typeof PropTypes[key] === 'function') {
              PropTypes[key].isRequired = PropTypes[key];
            }
          });
          
          export default PropTypes;
        `;
      }
      return null;
    }
  });
}

// Check if running in production mode
const isProd = process.env.NODE_ENV === 'production';
const forceIncludeAll = process.env.VITE_FORCE_INCLUDE_ALL === 'true';

// Create JSX runtime fallback module content
const createJsxRuntimeFallback = () => {
  const filePath = resolve('./src/jsx-runtime-fallback.js');

  // Create fallback file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    const content = `
// Fallback JSX runtime implementation
export function jsx(type, props, key) {
  const element = { type, props, key };
  return element;
}

export function jsxs(type, props, key) {
  return jsx(type, props, key);
}

export const Fragment = Symbol('Fragment');
export default { jsx, jsxs, Fragment };
`;
    fs.writeFileSync(filePath, content);
  }

  return filePath;
};

// Path to JSX runtime fallback
const jsxRuntimeFallback = createJsxRuntimeFallback();

// Configuration for both development and production
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

  console.log(`Running Vite in ${mode} mode`);

  // Base configuration
  const config = {
    root: './',
    // Use absolute path for assets
    base: '/',
    plugins: [reactPlugin(), propTypesResolver()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL('./src', import.meta.url)),
        "@components": fileURLToPath(new URL('./src/components', import.meta.url)),
        "@pages": fileURLToPath(new URL('./src/pages', import.meta.url)),
        "@store": fileURLToPath(new URL('./src/store', import.meta.url)),
        "@styles": fileURLToPath(new URL('./src/styles', import.meta.url)),
        "@assets": fileURLToPath(new URL('./src/assets', import.meta.url)),
        "@utils": fileURLToPath(new URL('./src/utils', import.meta.url)),
        "@hooks": fileURLToPath(new URL('./src/hooks', import.meta.url)),
        "@contexts": fileURLToPath(new URL('./src/contexts', import.meta.url)),
        "@services": fileURLToPath(new URL('./src/services', import.meta.url)),
        // Add fallback for problematic packages when in production
        ...(isProd || forceIncludeAll ? {
          "react-router-dom": fileURLToPath(new URL('./src/vite-fallback.js', import.meta.url)),
          "prop-types": fileURLToPath(new URL('./src/fallbacks/prop-types.js', import.meta.url)),
        } : {}),
        // Provide fallbacks for common imports
        'prop-types': 'prop-types',
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      dedupe: ['three', 'react', 'react-dom', 'prop-types']
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: true,
      assetsInlineLimit: 4096,
      emptyOutDir: true,
      target: 'es2018',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          },
          manualChunks: {
            'three-bundle': ['three'],
            'vendor': ['react', 'react-dom', 'react-router-dom', 'redux-persist']
          },
          // Generate predictable filenames without hashes for easier debugging
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        extensions: ['.js', '.jsx']
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'prop-types'],
      esbuildOptions: {
        jsx: 'automatic'
      }
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      fs: {
        strict: true,
        allow: ['..']
      },
      proxy: {
        "/api": {
          target: "http://localhost:5001",
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path,
        },
      },
    },
    // Disable automatic React injection
    esbuild: {
      jsx: 'automatic',
      // Don't inject React import
      jsxInject: false
    },
    // Configure public directory
    publicDir: 'public',
  };

  // Add production-specific configurations
  if (isProduction) {
    config.build.rollupOptions.output.manualChunks = function (id) {
      if (id.includes('node_modules')) {
        if (id.includes('react') || id.includes('react-dom')) {
          return 'vendor-react';
        }
        return 'vendor'; // all other node_modules
      }
    };
  }

  return config;
});
