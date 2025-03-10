// @ts-check
const loadConfig = async () => {
  try {
    // Try ESM first
    const { defineConfig } = await import('vite')
    const react = await import('@vitejs/plugin-react')
    const path = await import('path')
    const { fileURLToPath } = await import('url')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    return defineConfig({
      plugins: [react.default()],
      build: {
        outDir: '../static',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src')
        }
      },
      // Add more verbose logging
      logLevel: 'info',
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true
          }
        }
      }
    })
  } catch (e) {
    // Fallback to CommonJS
    const { defineConfig } = require('vite')
    const react = require('@vitejs/plugin-react')
    const path = require('path')

    return defineConfig({
      plugins: [react()],
      build: {
        outDir: '../static',
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src')
        }
      },
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true
          }
        }
      }
    })
  }
}

export default loadConfig()
