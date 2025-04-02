import { defineConfig } from "vite";
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import path from 'path';
import { resolve } from 'path';

// Try to import react plugin, fallback gracefully if not available
let reactPlugin;
try {
  reactPlugin = require('@vitejs/plugin-react').default;
} catch (e) {
  console.warn('Warning: @vitejs/plugin-react not found, using empty plugin fallback');
  reactPlugin = () => ({
    name: 'react-plugin-fallback',
    // Empty plugin with minimal implementation
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

export default defineConfig({
  plugins: [reactPlugin()],
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
      // Add explicit JSX runtime aliases
      "react/jsx-runtime": jsxRuntimeFallback,
      "react/jsx-dev-runtime": jsxRuntimeFallback,
      // Add fallback for problematic packages when in production
      ...(isProd || forceIncludeAll ? {
        "react-router-dom": fileURLToPath(new URL('./src/vite-fallback.js', import.meta.url)),
      } : {})
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [],
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            '@reduxjs/toolkit',
            'react-redux'
          ],
          ui: [
            'antd',
            '@ant-design/icons',
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          three: ['three'],
          tone: ['tone']
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
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
});
