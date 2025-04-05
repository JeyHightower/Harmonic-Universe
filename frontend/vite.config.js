import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses, including LAN and public addresses
    hmr: {
      clientPort: 5173, // Default client port
      port: 5173, // Explicitly set WebSocket port
      overlay: true, // Show overlay on errors
      timeout: 30000, // Increase the timeout to 30 seconds
    },
    watch: {
      usePolling: true, // Use polling for file changes which can be more reliable
    },
    strictPort: false, // Allow fallback to another port if 5173 is taken
    cors: true, // Enable CORS for all requests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      // Add alias for redux-persist subpaths
      'redux-persist/integration/react': path.resolve(__dirname, 'node_modules/redux-persist/integration/react')
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Add specific external dependencies with proper input format
      external: [],
      output: {
        manualChunks: (id) => {
          // React and related packages
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }

          // MUI Libraries
          if (id.includes('node_modules/@mui/material')) {
            // Split MUI components more granularly
            if (id.includes('Alert')) {
              return 'mui-feedback';
            }
            return 'mui-core';
          }

          if (id.includes('node_modules/@mui/icons-material')) {
            return 'mui-icons';
          }

          // Redux and related packages
          if (id.includes('node_modules/react-redux') ||
            id.includes('node_modules/@reduxjs/toolkit') ||
            id.includes('node_modules/redux-persist')) {
            return 'vendor-redux';
          }

          // Router
          if (id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }

          // Ant Design Core
          if (id.includes('node_modules/antd') &&
            !id.includes('node_modules/antd/es/icon') &&
            !id.includes('node_modules/antd/es/table') &&
            !id.includes('node_modules/antd/es/form') &&
            !id.includes('node_modules/antd/es/menu')) {
            return 'antd-core';
          }

          // Ant Design Icons - split into smaller groups
          if (id.includes('node_modules/@ant-design/icons')) {
            // Outlined icons
            if (id.includes('Outlined')) {
              return 'antd-icons-outlined';
            }
            // Filled icons
            else if (id.includes('Filled')) {
              return 'antd-icons-filled';
            }
            // Two-tone icons
            else if (id.includes('TwoTone')) {
              return 'antd-icons-twotone';
            }
            // Icon base or other icon components
            else {
              return 'antd-icons-base';
            }
          }

          // Ant Design icon components
          if (id.includes('node_modules/antd/es/icon')) {
            return 'antd-icons-components';
          }

          // Ant Design Table
          if (id.includes('node_modules/antd/es/table')) {
            return 'antd-table';
          }

          // Ant Design Form
          if (id.includes('node_modules/antd/es/form')) {
            return 'antd-form';
          }

          // Ant Design Menu
          if (id.includes('node_modules/antd/es/menu')) {
            return 'antd-menu';
          }

          // Tone.js
          if (id.includes('node_modules/tone')) {
            return 'tone';
          }

          // Common dependencies
          if (id.includes('node_modules/axios') ||
            id.includes('node_modules/qs') ||
            id.includes('node_modules/query-string')) {
            return 'vendor-http';
          }

          // Date/time libraries
          if (id.includes('node_modules/moment') ||
            id.includes('node_modules/date-fns')) {
            return 'vendor-datetime';
          }

          // Utility libraries
          if (id.includes('node_modules/lodash') ||
            id.includes('node_modules/ramda') ||
            id.includes('node_modules/underscore')) {
            return 'vendor-utils';
          }

          // Services
          if (id.includes('/src/services/')) {
            return 'services';
          }

          // Utils
          if (id.includes('/src/utils/')) {
            return 'utils';
          }

          // Components by category
          if (id.includes('/src/components/common/')) {
            return 'components-common';
          }

          if (id.includes('/src/components/modals/')) {
            return 'components-modals';
          }

          if (id.includes('/src/components/layout/')) {
            return 'components-layout';
          }

          if (id.includes('/src/components/music/')) {
            return 'components-music';
          }

          if (id.includes('/src/components/physics/')) {
            return 'components-physics';
          }

          if (id.includes('/src/components/auth/')) {
            return 'components-auth';
          }

          // All other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-others';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'react-router-dom',
      'prop-types',
      'redux-persist',
      'redux-persist/integration/react',
      'antd',
      '@ant-design/icons',
      '@mui/material',
      '@mui/icons-material',
      'tone'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
