import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from "vite";
import fs from 'fs';
import path from 'path';

// Check if running in production mode
const isProd = process.env.NODE_ENV === 'production';
const forceIncludeAll = process.env.VITE_FORCE_INCLUDE_ALL === 'true';

export default defineConfig({
  plugins: [react()],
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
