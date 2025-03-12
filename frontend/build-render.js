// ES Module compatible build script for Render
import { build } from 'vite';

// Set environment variables to force pure JS implementation
process.env.ROLLUP_SKIP_NODEJS_NATIVE_BUILD = 'true';
process.env.ROLLUP_NATIVE_PURE_JS = 'true';
process.env.ROLLUP_DISABLE_NATIVE = 'true';
process.env.VITE_SKIP_ROLLUP_NATIVE = 'true';
process.env.VITE_PURE_JS = 'true';
process.env.VITE_FORCE_ESM = 'true';

console.log('🚀 Starting Vite build with pure JS implementation...');

// Run the build with production mode and emptyOutDir option
build({
    mode: 'production',
    emptyOutDir: true,
    configFile: './vite.config.render.js' // Use the render-specific config
}).then(() => {
    console.log('✅ Build completed successfully!');
}).catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
