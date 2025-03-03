import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Create a custom plugin that provides empty implementations for all Ant Design icon imports
const antDesignIconsPlugin = () => {
  return {
    name: 'vite:ant-design-icons-resolver',

    resolveId(id, importer) {
      // Handle direct imports from the main icons package
      if (id === '@ant-design/icons') {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle specific icon imports from the main package
      if (id.startsWith('@ant-design/icons/es/icons/')) {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle Context import
      if (id === '@ant-design/icons/es/components/Context') {
        return path.resolve(__dirname, 'src/components/common/es/components/Context.js');
      }

      // Handle all icon SVG imports that are causing errors
      if (id.startsWith('@ant-design/icons-svg/es/asn/')) {
        // Mark all these imports as external to prevent bundling errors
        return { id, external: true };
      }

      // Handle other @ant-design/icons-svg imports
      if (id.startsWith('@ant-design/icons-svg')) {
        return { id, external: true };
      }

      // Handle relative imports within the @ant-design/icons/es/icons directory
      if (importer && importer.includes('@ant-design/icons/es/icons') &&
        (id.startsWith('./') || id.startsWith('../'))) {
        // This handles imports like './AccountBookFilled' in the index.js file
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Handle cases where something is trying to import from Icons.jsx as if it were a directory
      if (importer && importer.includes('@ant-design/icons') &&
        (id.includes('Icons.jsx/') || id.endsWith('Icons.jsx'))) {
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
      }

      // Also handle direct access to specific icon components
      if (id.includes('/src/components/common/Icons.jsx/')) {
        // Extract the icon name from the path
        const iconName = id.split('/Icons.jsx/').pop();
        return path.resolve(__dirname, 'src/components/common/Icons.jsx');
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
      if (id === path.resolve(__dirname, 'src/components/common/Icons.jsx') ||
        id.includes('/Icons.jsx/')) {
        return `
          import React from 'react';
          import IconContext from './es/components/Context';

          // Add debug log with a unique identifier
          console.log('==== ICONS.JSX IS BEING LOADED ====');

          // Basic Icon component
          const Icon = (props) => {
            return <span className="anticon" {...props} />;
          };

          // Export components namespaces
          Icon.Context = IconContext;

          // Create a generic function for any other icon and iconFont
          const createFromIconfontCN = () => {
            return function IconFont(props) {
              return <span className="anticon" {...props} />;
            };
          };

          // Assign the function to Icon
          Icon.createFromIconfontCN = createFromIconfontCN;

          // Create icon components
          export const PlusOutlined = props => <Icon {...props} />
          export const EditOutlined = props => <Icon {...props} />
          export const DeleteOutlined = props => <Icon {...props} />
          export const CaretRightOutlined = props => <Icon {...props} />
          export const DownloadOutlined = props => <Icon {...props} />
          export const EyeOutlined = props => <Icon {...props} />
          export const InfoCircleOutlined = props => <Icon {...props} />
          export const PauseOutlined = props => <Icon {...props} />
          export const RobotOutlined = props => <Icon {...props} />
          export const SettingOutlined = props => <Icon {...props} />
          export const SyncOutlined = props => <Icon {...props} />
          export const EyeInvisibleOutlined = props => <Icon {...props} />
          export const EnterOutlined = props => <Icon {...props} />

          // Add all the icons from the error list
          export const AccountBookFilled = props => <Icon {...props} />
          export const AccountBookOutlined = props => <Icon {...props} />
          export const AccountBookTwoTone = props => <Icon {...props} />
          export const AlertFilled = props => <Icon {...props} />
          export const AlertOutlined = props => <Icon {...props} />
          export const AlertTwoTone = props => <Icon {...props} />
          export const AlibabaOutlined = props => <Icon {...props} />
          export const AlignCenterOutlined = props => <Icon {...props} />
          export const AlignLeftOutlined = props => <Icon {...props} />
          export const AlignRightOutlined = props => <Icon {...props} />
          export const AliwangwangFilled = props => <Icon {...props} />
          export const AliwangwangOutlined = props => <Icon {...props} />
          export const AmazonOutlined = props => <Icon {...props} />
          export const AndroidFilled = props => <Icon {...props} />
          export const AndroidOutlined = props => <Icon {...props} />
          export const AntCloudOutlined = props => <Icon {...props} />
          export const AntDesignOutlined = props => <Icon {...props} />
          export const ApartmentOutlined = props => <Icon {...props} />
          export const ApiFilled = props => <Icon {...props} />
          export const ApiOutlined = props => <Icon {...props} />
          export const ApiTwoTone = props => <Icon {...props} />
          export const AppleFilled = props => <Icon {...props} />
          export const AppleOutlined = props => <Icon {...props} />
          export const AppstoreAddOutlined = props => <Icon {...props} />
          export const AppstoreFilled = props => <Icon {...props} />
          export const AppstoreOutlined = props => <Icon {...props} />
          export const AppstoreTwoTone = props => <Icon {...props} />
          export const AreaChartOutlined = props => <Icon {...props} />
          export const ArrowDownOutlined = props => <Icon {...props} />
          export const ArrowLeftOutlined = props => <Icon {...props} />
          export const ArrowRightOutlined = props => <Icon {...props} />
          export const ArrowUpOutlined = props => <Icon {...props} />
          export const AuditOutlined = props => <Icon {...props} />
          export const AudioFilled = props => <Icon {...props} />
          export const AudioMutedOutlined = props => <Icon {...props} />
          export const AudioOutlined = props => <Icon {...props} />
          export const AudioTwoTone = props => <Icon {...props} />
          export const BarcodeOutlined = props => <Icon {...props} />
          export const BugFilled = props => <Icon {...props} />
          export const CarryOutTwoTone = props => <Icon {...props} />
          export const ClockCircleTwoTone = props => <Icon {...props} />
          export const CloseCircleOutlined = props => <Icon {...props} />
          export const CloseCircleTwoTone = props => <Icon {...props} />
          export const CloseSquareTwoTone = props => <Icon {...props} />
          export const CloudDownloadOutlined = props => <Icon {...props} />
          export const CloudUploadOutlined = props => <Icon {...props} />
          export const ClusterOutlined = props => <Icon {...props} />
          export const DeleteRowOutlined = props => <Icon {...props} />
          export const DiffOutlined = props => <Icon {...props} />
          export const DislikeOutlined = props => <Icon {...props} />
          export const DollarCircleOutlined = props => <Icon {...props} />
          export const DribbbleOutlined = props => <Icon {...props} />
          export const FileDoneOutlined = props => <Icon {...props} />
          export const FileExclamationTwoTone = props => <Icon {...props} />
          export const FileJpgOutlined = props => <Icon {...props} />
          export const FileProtectOutlined = props => <Icon {...props} />
          export const FileSearchOutlined = props => <Icon {...props} />
          export const FileZipTwoTone = props => <Icon {...props} />
          export const FrownTwoTone = props => <Icon {...props} />
          export const FullscreenExitOutlined = props => <Icon {...props} />
          export const GitlabOutlined = props => <Icon {...props} />
          export const GooglePlusCircleFilled = props => <Icon {...props} />
          export const GroupOutlined = props => <Icon {...props} />
          export const HistoryOutlined = props => <Icon {...props} />
          export const HourglassTwoTone = props => <Icon {...props} />
          export const IeCircleFilled = props => <Icon {...props} />
          export const MacCommandOutlined = props => <Icon {...props} />
          export const MehTwoTone = props => <Icon {...props} />
          export const MergeCellsOutlined = props => <Icon {...props} />
          export const MessageOutlined = props => <Icon {...props} />
          export const PaperClipOutlined = props => <Icon {...props} />
          export const PinterestFilled = props => <Icon {...props} />
          export const PushpinTwoTone = props => <Icon {...props} />
          export const ReloadOutlined = props => <Icon {...props} />
          export const SafetyCertificateTwoTone = props => <Icon {...props} />
          export const ShopFilled = props => <Icon {...props} />
          export const ShoppingCartOutlined = props => <Icon {...props} />
          export const SmileTwoTone = props => <Icon {...props} />
          export const SolutionOutlined = props => <Icon {...props} />
          export const TikTokFilled = props => <Icon {...props} />
          export const TikTokOutlined = props => <Icon {...props} />
          export const ToolTwoTone = props => <Icon {...props} />
          export const TruckOutlined = props => <Icon {...props} />
          export const TwitchFilled = props => <Icon {...props} />
          export const UngroupOutlined = props => <Icon {...props} />
          export const UserAddOutlined = props => <Icon {...props} />
          export const UserOutlined = props => <Icon {...props} />
          export const WalletFilled = props => <Icon {...props} />
          export const WalletOutlined = props => <Icon {...props} />
          export const WalletTwoTone = props => <Icon {...props} />
          export const WarningFilled = props => <Icon {...props} />
          export const WarningOutlined = props => <Icon {...props} />
          export const WarningTwoTone = props => <Icon {...props} />
          export const WechatFilled = props => <Icon {...props} />
          export const WechatOutlined = props => <Icon {...props} />
          export const WeiboCircleFilled = props => <Icon {...props} />
          export const WeiboCircleOutlined = props => <Icon {...props} />
          export const WeiboOutlined = props => <Icon {...props} />
          export const WeiboSquareFilled = props => <Icon {...props} />
          export const WeiboSquareOutlined = props => <Icon {...props} />
          export const WhatsAppOutlined = props => <Icon {...props} />
          export const WifiOutlined = props => <Icon {...props} />
          export const WindowsFilled = props => <Icon {...props} />
          export const WindowsOutlined = props => <Icon {...props} />
          export const WomanOutlined = props => <Icon {...props} />
          export const XFilled = props => <Icon {...props} />
          export const YahooFilled = props => <Icon {...props} />
          export const YahooOutlined = props => <Icon {...props} />
          export const UserSwitchOutlined = props => <Icon {...props} />
          export const UnlockTwoTone = props => <Icon {...props} />
          export const TrademarkOutlined = props => <Icon {...props} />
          export const YuqueOutlined = props => <Icon {...props} />
          export const ZhihuOutlined = props => <Icon {...props} />

          // Create a proxy to handle any requested icon
          const handler = {
            get(target, prop) {
              // If we have the component, return it
              if (prop in target) {
                return target[prop];
              }

              // Otherwise return a default empty component
              return function DefaultIcon(props) {
                return <span className="anticon" {...props} />;
              };
            }
          };

          // Export the createFromIconfontCN function
          export { createFromIconfontCN };

          // Export default with proxy
          export default Icon;
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
