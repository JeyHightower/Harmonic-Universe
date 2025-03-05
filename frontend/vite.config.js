import { defineConfig } from 'vite';
import path from 'path';
// Use the standard react plugin import
import react from '@vitejs/plugin-react';
import patchAntDesignPlugin from './src/utils/patchAntdIcons';

// Create a custom plugin that handles missing Ant Design icon SVG modules
const handleMissingModulesPlugin = () => {
  // Track which icon paths we've already processed
  const processedPaths = new Set();
  let isBuild = false;

  return {
    name: 'handle-missing-antd-icons-plugin',
    // Ensure this runs before other plugins including vite's internal plugins
    enforce: 'pre',

    configResolved(config) {
      isBuild = config.command === 'build';
      console.log(`[AntDesignPlugin] Running in ${isBuild ? 'build' : 'dev'} mode`);
    },

    resolveId(id, importer) {
      // Handle ALL possible path formats for Ant Design SVG icons
      // Make the condition more inclusive to catch all possible import patterns
      if (id.includes('@ant-design/icons-svg')) {
        // Extract the icon name from the path - it's the last segment
        const iconNameWithExt = id.split('/').pop();
        const iconName = iconNameWithExt.replace(/\.\w+$/, '');

        // Avoid excessive logging in development
        if (!processedPaths.has(id)) {
          processedPaths.add(id);
          console.log(`[AntDesignPlugin] Resolving icon: ${iconName} from ${importer || 'unknown'}`);
        }

        // Create a virtual module ID that our load hook will recognize
        return {
          id: `\0virtual:ant-icon:${iconName}`,
          moduleSideEffects: false,
          external: false  // Ensure it's not treated as external
        };
      }

      return null;
    },

    load(id) {
      // Handle our virtual module IDs from resolveId
      if (id.startsWith('\0virtual:ant-icon:')) {
        const iconName = id.slice('\0virtual:ant-icon:'.length);

        // For build mode we only log once per icon
        if (isBuild && !processedPaths.has(`load:${iconName}`)) {
          processedPaths.add(`load:${iconName}`);
          console.log(`[AntDesignPlugin] Providing virtual module for: ${iconName}`);
        }

        // Generate a generic mock SVG icon module for any requested icon
        return `
          export default {
            name: "${iconName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}",
            theme: "${iconName.includes('Filled') ? 'filled' : iconName.includes('Outlined') ? 'outlined' : 'outlined'}",
            icon: {
              tag: 'svg',
              attrs: {
                viewBox: '64 64 896 896',
                focusable: 'false',
                'data-icon': "${iconName.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}",
                width: '1em',
                height: '1em',
                fill: 'currentColor'
              },
              children: [
                {
                  tag: 'path',
                  attrs: { d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z' }
                }
              ]
            }
          };
          export const __esModule = true;
        `;
      }

      return null;
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache', // Use a specific cache directory we can control
  plugins: [
    // Use the handleMissingModulesPlugin first to ensure it catches all icon imports
    handleMissingModulesPlugin(),
    // Use the react plugin with standard configuration
    react(),
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
      // Add alias for react-refresh/babel to our mock file
      'react-refresh/babel': path.resolve(__dirname, 'src/utils/hacks/babel-mock.js'),

      // React-is shim for compatibility
      'react-is': path.resolve(__dirname, 'src/utils/react-is-shim.js'),

      // Continue with other aliases
      'classnames': path.resolve(__dirname, 'node_modules/classnames'),
      '@': path.resolve(__dirname, 'src')
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // Ensure all CommonJS modules are correctly transformed
      include: [/node_modules/],
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    // Configure code splitting via Rollup options
    rollupOptions: {
      external: ['three'],
      output: {
        manualChunks: (id) => {
          // Create a chunk for Ant Design icons
          if (id.includes('@ant-design/icons')) {
            return 'ant-icons';
          }
          // Create a chunk for major libraries
          if (id.includes('node_modules') &&
            (id.includes('react') ||
              id.includes('redux') ||
              id.includes('axios') ||
              id.includes('firebase'))) {
            return 'vendor';
          }
          // Add a specific chunk for antd
          if (id.includes('node_modules/antd')) {
            return 'antd';
          }
        },
      }
    },
  },
  optimizeDeps: {
    // Include antd to ensure it's pre-bundled
    include: [
      'antd',
      'classnames',
      '@ant-design/icons',
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'three'
    ],
    // Exclude ALL icon SVG paths to prevent direct optimization
    exclude: [
      '@ant-design/icons-svg'
    ],
    // Force re-optimization on server restart
    force: true,
    // Disable optimization caching
    cacheDir: null,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      // Enable proper CommonJS to ESM conversion
      format: 'esm',
      supported: {
        'top-level-await': true
      },
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
