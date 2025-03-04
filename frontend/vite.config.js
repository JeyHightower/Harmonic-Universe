import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import patchAntDesignPlugin from './src/utils/patchAntdIcons';

// Create a custom plugin that handles missing Ant Design icon SVG modules
const handleMissingModulesPlugin = () => {
  // Track processed icon paths to avoid duplicates
  const processedIcons = new Set();

  return {
    name: 'handle-missing-modules',

    resolveId(id) {
      // Specifically target all ant-design icon SVG paths
      if (id.includes('@ant-design/icons-svg/es/asn/')) {
        console.log(`[AntDesignPlugin] Marking as external: ${id}`);
        // Mark as external with absolute path
        return { id, external: 'absolute' };
      }

      return null;
    },

    // Add a load hook to provide empty implementations if needed
    load(id) {
      if (id.includes('@ant-design/icons-svg/es/asn/')) {
        const iconName = id.split('/').pop().replace(/\.\w+$/, '');

        // Avoid logging duplicates
        if (!processedIcons.has(iconName)) {
          processedIcons.add(iconName);
          console.log(`[AntDesignPlugin] Creating virtual module for: ${iconName}`);
        }

        // Determine icon theme based on name
        let theme = 'outlined'; // default
        if (iconName.includes('Filled')) {
          theme = 'filled';
        } else if (iconName.includes('TwoTone')) {
          theme = 'twotone';
        }

        // Return a minimal SVG icon implementation
        return `
          export default {
            name: '${iconName}',
            theme: '${theme}',
            icon: {
              tag: 'svg',
              attrs: { viewBox: '64 64 896 896' },
              children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
            }
          };
        `;
      }

      return null;
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    handleMissingModulesPlugin(),
    patchAntDesignPlugin()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(
              'Received Response from the Target:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: 600,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      // Add an alias for classnames to handle it properly
      'classnames': path.resolve(__dirname, 'node_modules/classnames/index.js')
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // Ensure all CommonJS modules are correctly transformed
      include: [/node_modules/],
    },
    // Configure a higher chunk size warning limit
    chunkSizeWarningLimit: 800,
    // Configure code splitting via Rollup options
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle React and related packages
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }

          // Handle Ant Design
          if (id.includes('node_modules/antd/') ||
            id.includes('node_modules/@ant-design/')) {
            return 'vendor-antd';
          }

          // Handle Redux
          if (id.includes('node_modules/react-redux/') ||
            id.includes('node_modules/redux/') ||
            id.includes('node_modules/@reduxjs/toolkit/') ||
            id.includes('node_modules/redux-thunk/')) {
            return 'vendor-redux';
          }

          // Handle Three.js and 3D libraries
          if (id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/')) {
            return 'vendor-three';
          }

          // Handle other common libraries
          if (id.includes('node_modules/')) {
            // Split all other libraries into a separate chunk
            return 'vendor-misc';
          }

          // Split the UniverseDetail component's chunks
          if (id.includes('/UniverseDetail') ||
            id.includes('/components/features/universe/')) {
            return 'universe';
          }

          // Split other large components
          if (id.includes('/components/features/')) {
            return 'features';
          }
        }
      },
      // Mark all @ant-design/icons-svg paths as external
      external: [/.*@ant-design\/icons-svg\/es\/asn\/.*/]
    },
  },
  optimizeDeps: {
    // Tell Vite to not try to bundle these
    exclude: ['@ant-design/icons-svg'],
    include: ['classnames'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      // Enable proper CommonJS to ESM conversion
      format: 'esm',
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
