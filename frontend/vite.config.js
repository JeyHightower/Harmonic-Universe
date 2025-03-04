import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Create a custom plugin that provides empty implementations for all Ant Design icon imports
const antDesignIconsPlugin = () => {
  return {
    name: 'vite:ant-design-icons-resolver',

    resolveId(id, importer) {
      // Handle main @ant-design/icons module
      if (id === '@ant-design/icons') {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle specific icon imports from the main package
      if (id.startsWith('@ant-design/icons/')) {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle @ant-design/icons-svg paths, specifically targeting the es/asn/ pattern
      if (id.startsWith('@ant-design/icons-svg/es/asn/') || id.startsWith('@ant-design/icons-svg')) {
        // Extract the icon name from the path for better virtual module naming
        const iconName = id.split('/').pop().replace(/\.\w+$/, '');
        return `\0virtual:ant-icons-svg/${iconName}`;
      }

      // Handle internal, relative imports within the ant-design/icons package
      if (importer &&
        (importer.includes('@ant-design/icons') ||
          importer.includes('node_modules/antd')) &&
        (id.startsWith('./') || id.startsWith('../'))) {

        // Mark this as a virtual module
        return `\0virtual:ant-icons/${id.replace(/\.js$/, '')}`;
      }

      return null;
    },

    load(id) {
      // Handle virtual modules for ant-design icons
      if (id.startsWith('\0virtual:ant-icons/')) {
        // Generate a minimal React component that renders an empty span
        return `
          import React from 'react';
          export default function IconComponent(props) {
            return React.createElement('span', {
              ...props,
              className: 'anticon' + (props.className ? ' ' + props.className : ''),
              style: { ...props.style, display: 'inline-flex' }
            });
          }
        `;
      }

      // Handle virtual modules for ant-design-svg icons
      if (id.startsWith('\0virtual:ant-icons-svg/')) {
        // Extract the icon name from the virtual module ID
        const iconName = id.substring('\0virtual:ant-icons-svg/'.length);

        // Generate proper SVG data structure for the icon
        return `
          export default {
            name: '${iconName}',
            theme: 'outlined',
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
    antDesignIconsPlugin()
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
      'components': path.resolve(__dirname, 'src/components')
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
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
      }
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    // Mark all Ant Design icons as external to prevent build errors
    exclude: ['@ant-design/icons-svg', '@ant-design/icons']
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
