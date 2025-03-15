// @ts-check
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Special Vite configuration for Render.com deployment
export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        commonjsOptions: {
            transformMixedEsModules: true,
            include: [/node_modules/],
        },
        rollupOptions: {
            external: [],
            output: {
                manualChunks: {
                    vendor: [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        '@reduxjs/toolkit',
                        'react-redux'
                    ],
                },
            },
            context: 'globalThis',
            shimMissingExports: true,
            treeshake: {
                moduleSideEffects: 'no-external',
                propertyReadSideEffects: false,
            },
            onwarn(warning, warn) {
                if (warning.code === 'CIRCULAR_DEPENDENCY') return;
                warn(warning);
            }
        },
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
            'axios',
            'moment',
            'prop-types'
        ],
        esbuildOptions: {
            target: 'es2020',
        },
    },

    json: {
        stringify: true,
    }
});
