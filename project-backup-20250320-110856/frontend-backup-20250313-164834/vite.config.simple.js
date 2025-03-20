// @ts-check
import { defineConfig } from 'vite';

// Simplified Vite config for deployment fallback
export default defineConfig({
    // Skip plugins to avoid native module issues
    plugins: [],

    // Basic build configuration
    build: {
        outDir: '../static',
        emptyOutDir: true,
        minify: false, // Skip minification for faster builds
        rollupOptions: {
            // Use classic plugin instead of terser
            output: {
                format: 'es',
                minifyInternalExports: false
            }
        }
    },

    // Simple server config
    server: {
        port: 5173,
        strictPort: false
    },

    // Force optimizeDeps to run without native modules
    optimizeDeps: {
        disabled: false,
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
});
