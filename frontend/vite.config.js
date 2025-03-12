// @ts-check
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Simplified Vite config specifically for Render.com deployment
export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },

    build: {
        outDir: '../static',
        emptyOutDir: true,
        rollupOptions: {
            external: [], // Don't externalize dependencies
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'antd'],
                },
                format: 'es'
            }
        },
        commonjsOptions: {
            include: [
                /node_modules/
            ],
            transformMixedEsModules: true
        },
        target: 'es2015',
        sourcemap: false,
        minify: true
    },

    define: {
        'process.env': {}
    },

    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
            'antd',
            '@ant-design/icons',
            'axios',
            'moment',
            'prop-types'
        ],
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
});
