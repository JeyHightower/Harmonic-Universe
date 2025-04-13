import path from'path';
import{defineConfig}from'vite';export default defineConfig({resolve:{alias:{'react/jsx-runtime':path.resolve('./src/jsx-runtime.mjs"),'react/jsx-dev-runtime':path.resolve('./src/jsx-dev-runtime.mjs")}},build:{outDir:'dist'}});
