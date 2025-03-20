import { build } from 'vite';

async function runBuild() {
  try {
    await build({
      configFile: './vite.config.js',
      mode: 'production',
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

runBuild();
