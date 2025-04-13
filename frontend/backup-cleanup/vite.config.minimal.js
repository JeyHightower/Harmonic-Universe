import path from'path';
import{defineConfig}from'vite';export default defineConfig({resolve:{alias:{'react/jsx-runtime':path.resolve('./src/jsx-runtime.js'),'react/jsx-dev-runtime':path.resolve('./src/jsx-dev-runtime.js')}},build:{outDir:'dist'}});
