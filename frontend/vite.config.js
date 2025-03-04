import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import patchAntDesignPlugin from './src/utils/patchAntdIcons';

// Create a custom plugin that handles missing Ant Design icon SVG modules
const handleMissingModulesPlugin = () => {
  // Track which icon paths we've already processed
  const processedPaths = new Set();
  let isBuild = false;

  return {
    name: 'handle-missing-antd-icons-plugin',
    // Make this plugin run before other plugins
    enforce: 'pre',

    configResolved(config) {
      isBuild = config.command === 'build';
      console.log(`[AntDesignPlugin] Running in ${isBuild ? 'build' : 'dev'} mode`);
    },

    resolveId(id, importer) {
      // Handle ALL possible path formats for Ant Design SVG icons
      if (
        id.includes('@ant-design/icons-svg') &&
        (id.includes('/asn/') || id.includes('/lib/') || id.includes('/es/'))
      ) {
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

        // Generate a module that imports our shim and forwards the request
        return `
          import { getIcon } from '@/utils/ant-icons-shim';
          export default getIcon('${iconName}').default;
          export const __esModule = true;
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
      // React-is shim for compatibility
      'react-is': path.resolve(__dirname, 'src/utils/react-is-shim.js'),

      // Alias for any ant-design icon path pattern
      '@ant-design/icons-svg/es/asn': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
      '@ant-design/icons-svg/lib/asn': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
      '@ant-design/icons-svg/es': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
      '@ant-design/icons-svg/lib': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
      '@ant-design/icons-svg': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),

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
      output: {
        // Improve chunking strategy
        manualChunks: (id) => {
          // Group Ant Design icons into a single chunk
          if (id.includes('@ant-design/icons')) {
            return 'icons';
          }

          // Group major libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('redux')) {
              return 'vendor-react-redux';
            }
            if (id.includes('antd')) {
              return 'vendor-antd';
            }
            // All other node_modules
            return 'vendor';
          }
        },
        // Reduce the number of chunks by increasing the size threshold
        minChunkSize: 10000,
      }
    },
  },
  optimizeDeps: {
    // Exclude the problematic packages from optimization
    exclude: ['@ant-design/icons-svg', '@ant-design/icons'],
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
