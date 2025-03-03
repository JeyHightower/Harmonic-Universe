import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Create a custom plugin that provides empty implementations for all Ant Design icon imports
const antDesignIconsPlugin = () => {
  return {
    name: 'vite:ant-design-icons-plugin',

    resolveId(id, importer) {
      // Handle direct imports from @ant-design/icons
      if (id === '@ant-design/icons' || id === '@ant-design/icons/es/icons') {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle the Context import from Icons.jsx directory access
      if (id.includes('/Icons.jsx/') && id.endsWith('/es/components/Context')) {
        return path.resolve(__dirname, 'src/components/common/es/components/Context.js');
      }

      // Handle individual icon imports - for paths like Icons.jsx/IconName
      if (id.includes('/Icons.jsx/')) {
        // Direct all individual icon imports to the main Icons.jsx file
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle direct import of Context
      if (id === '@ant-design/icons/es/components/Context') {
        return path.resolve(__dirname, 'src/components/common/es/components/Context.js');
      }

      return null;
    },

    // Add a middleware to intercept requests that try to access Icons.jsx as a directory
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if the URL contains Icons.jsx/ (which would indicate treating a file as a directory)
        if (req.url && req.url.includes('/Icons.jsx/')) {
          // Redirect to Icons.jsx instead
          req.url = '/src/components/common/Icons.jsx';
          console.log('Redirected URL:', req.url);
        }
        next();
      });
    },

    load(id) {
      // For imports to our custom icon component, return the component implementation
      if (id === path.resolve(__dirname, 'src/components/common/Icons.jsx')) {
        return `
          import React from 'react';
          import IconContext from './es/components/Context';

          // Add debug log with a unique identifier
          console.log('==== ICONS.JSX IS BEING LOADED ====');

          // Basic Icon component
          const Icon = (props) => {
            return <span className="anticon" {...props} />;
          };

          // Set two tone color methods that Ant Design expects
          Icon.getTwoToneColor = () => '#1890ff';
          Icon.setTwoToneColor = () => {};

          // Set Context properly
          Icon.Context = IconContext;

          // Create a generic function for creating icon components
          const createIconComponent = (displayName) => {
            const IconComponent = (props) => <Icon {...props} data-icon-name={displayName} />;
            IconComponent.displayName = displayName;
            return IconComponent;
          };

          // Create a generic function for any other icon and iconFont
          function createFromIconfontCN(options = {}) {
            const IconFont = (props) => {
              return <span className="anticon" {...props} />;
            };
            IconFont.displayName = 'IconFont';
            return IconFont;
          }

          // Assign the function to Icon
          Icon.createFromIconfontCN = createFromIconfontCN;

          // Create ALL commonly used Ant Design icons to ensure they're available
          // This expanded list covers the most frequently used icons
          export const AccountBookFilled = createIconComponent('AccountBookFilled');
          export const AccountBookOutlined = createIconComponent('AccountBookOutlined');
          export const AlertFilled = createIconComponent('AlertFilled');
          export const AlertOutlined = createIconComponent('AlertOutlined');
          export const AliwangwangOutlined = createIconComponent('AliwangwangOutlined');
          export const AndroidOutlined = createIconComponent('AndroidOutlined');
          export const AppleOutlined = createIconComponent('AppleOutlined');
          export const ArrowDownOutlined = createIconComponent('ArrowDownOutlined');
          export const ArrowLeftOutlined = createIconComponent('ArrowLeftOutlined');
          export const ArrowRightOutlined = createIconComponent('ArrowRightOutlined');
          export const ArrowUpOutlined = createIconComponent('ArrowUpOutlined');
          export const BarsOutlined = createIconComponent('BarsOutlined');
          export const CalendarOutlined = createIconComponent('CalendarOutlined');
          export const CaretDownFilled = createIconComponent('CaretDownFilled');
          export const CaretDownOutlined = createIconComponent('CaretDownOutlined');
          export const CaretRightOutlined = createIconComponent('CaretRightOutlined');
          export const CaretUpOutlined = createIconComponent('CaretUpOutlined');
          export const CheckCircleFilled = createIconComponent('CheckCircleFilled');
          export const CheckCircleOutlined = createIconComponent('CheckCircleOutlined');
          export const CheckOutlined = createIconComponent('CheckOutlined');
          export const ClockCircleOutlined = createIconComponent('ClockCircleOutlined');
          export const CloseCircleFilled = createIconComponent('CloseCircleFilled');
          export const CloseCircleOutlined = createIconComponent('CloseCircleOutlined');
          export const CloseOutlined = createIconComponent('CloseOutlined');
          export const CloudDownloadOutlined = createIconComponent('CloudDownloadOutlined');
          export const CopyOutlined = createIconComponent('CopyOutlined');
          export const DeleteOutlined = createIconComponent('DeleteOutlined');
          export const DoubleLeftOutlined = createIconComponent('DoubleLeftOutlined');
          export const DoubleRightOutlined = createIconComponent('DoubleRightOutlined');
          export const DownOutlined = createIconComponent('DownOutlined');
          export const DownloadOutlined = createIconComponent('DownloadOutlined');
          export const EditOutlined = createIconComponent('EditOutlined');
          export const EllipsisOutlined = createIconComponent('EllipsisOutlined');
          export const EnterOutlined = createIconComponent('EnterOutlined');
          export const ExclamationCircleFilled = createIconComponent('ExclamationCircleFilled');
          export const ExclamationCircleOutlined = createIconComponent('ExclamationCircleOutlined');
          export const EyeInvisibleOutlined = createIconComponent('EyeInvisibleOutlined');
          export const EyeOutlined = createIconComponent('EyeOutlined');
          export const FileOutlined = createIconComponent('FileOutlined');
          export const FileTextOutlined = createIconComponent('FileTextOutlined');
          export const FileTwoTone = createIconComponent('FileTwoTone');
          export const FilterFilled = createIconComponent('FilterFilled');
          export const FolderOpenOutlined = createIconComponent('FolderOpenOutlined');
          export const FolderOutlined = createIconComponent('FolderOutlined');
          export const HolderOutlined = createIconComponent('HolderOutlined');
          export const InfoCircleFilled = createIconComponent('InfoCircleFilled');
          export const InfoCircleOutlined = createIconComponent('InfoCircleOutlined');
          export const LeftOutlined = createIconComponent('LeftOutlined');
          export const LoadingOutlined = createIconComponent('LoadingOutlined');
          export const MinusCircleOutlined = createIconComponent('MinusCircleOutlined');
          export const MinusOutlined = createIconComponent('MinusOutlined');
          export const MinusSquareOutlined = createIconComponent('MinusSquareOutlined');
          export const PaperClipOutlined = createIconComponent('PaperClipOutlined');
          export const PauseOutlined = createIconComponent('PauseOutlined');
          export const PictureTwoTone = createIconComponent('PictureTwoTone');
          export const PlusCircleOutlined = createIconComponent('PlusCircleOutlined');
          export const PlusOutlined = createIconComponent('PlusOutlined');
          export const PlusSquareOutlined = createIconComponent('PlusSquareOutlined');
          export const QuestionCircleOutlined = createIconComponent('QuestionCircleOutlined');
          export const ReloadOutlined = createIconComponent('ReloadOutlined');
          export const RightOutlined = createIconComponent('RightOutlined');
          export const RobotOutlined = createIconComponent('RobotOutlined');
          export const RotateLeftOutlined = createIconComponent('RotateLeftOutlined');
          export const RotateRightOutlined = createIconComponent('RotateRightOutlined');
          export const SearchOutlined = createIconComponent('SearchOutlined');
          export const SettingOutlined = createIconComponent('SettingOutlined');
          export const StarFilled = createIconComponent('StarFilled');
          export const SwapOutlined = createIconComponent('SwapOutlined');
          export const SwapRightOutlined = createIconComponent('SwapRightOutlined');
          export const SyncOutlined = createIconComponent('SyncOutlined');
          export const UpOutlined = createIconComponent('UpOutlined');
          export const UserAddOutlined = createIconComponent('UserAddOutlined');
          export const UserOutlined = createIconComponent('UserOutlined');
          export const VerticalAlignTopOutlined = createIconComponent('VerticalAlignTopOutlined');
          export const WarningFilled = createIconComponent('WarningFilled');
          export const WarningOutlined = createIconComponent('WarningOutlined');
          export const ZoomInOutlined = createIconComponent('ZoomInOutlined');
          export const ZoomOutOutlined = createIconComponent('ZoomOutOutlined');

          // Create a proxy to handle any requested icon
          const handler = {
            get(target, prop) {
              // If we have the component, return it
              if (prop in target) {
                return target[prop];
              }

              // For any other icon name that follows the naming convention, create it on demand
              if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
                return createIconComponent(prop);
              }

              // Return undefined for everything else
              return undefined;
            }
          };

          // Export the Context
          export const Context = IconContext;

          // Export the createFromIconfontCN function
          export { createFromIconfontCN };

          // Create a proxied version of Icon that dynamically creates icon components on demand
          const ProxiedIcon = new Proxy(Icon, handler);

          // Export default with proxy
          export default ProxiedIcon;
        `;
      }

      // Handle the Context.js file
      if (id === path.resolve(__dirname, 'src/components/common/es/components/Context.js')) {
        return `
          import React from 'react';

          // Add debug log with a unique identifier
          console.log('==== CONTEXT.JS IS BEING LOADED ====');

          // Create a Context for icon configuration
          const IconContext = React.createContext({
            // Default values for the context
            prefixCls: 'anticon',
            rootClassName: '',
            rtl: false
          });

          // Set displayName directly on the context as recommended by React
          IconContext.displayName = 'IconContext';

          // Export the default context
          export default IconContext;

          // Also provide a named export for flexibility
          export { IconContext };
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
      '@ant-design/icons/es/icons': path.resolve(__dirname, 'src/components/common/Icons.jsx'),
      '@ant-design/icons': path.resolve(__dirname, 'src/components/common/Icons.jsx'),
      '@ant-design/icons/es/components/Context': path.resolve(__dirname, 'src/components/common/es/components/Context.js'),
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
