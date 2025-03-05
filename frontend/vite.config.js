import { defineConfig } from 'vite';
import path from 'path';
// Use the standard react plugin import
import react from '@vitejs/plugin-react';
import patchAntDesignPlugin from './src/utils/patchAntdIcons';
import directPatchPlugin from './src/utils/directPatchPlugin';

// Create a plugin that injects version information into all Ant Design icons files
const injectVersionPlugin = () => {
  return {
    name: 'inject-antd-icons-version',
    // Run after other plugins have processed the files
    enforce: 'post',

    transform(code, id) {
      // Make the condition more inclusive to catch the chunk in both dev and build
      if ((id.includes('ant-icons') || id.includes('@ant-design/icons')) &&
        !code.includes('export { version }')) {
        console.log('[InjectVersion] Adding version to:', id);

        // More robust version injection that doesn't rely on existing structure
        const injection = `
// Injected version property for Ant Design Icons
const version = "4.2.1";
export { version };
if (typeof window !== 'undefined') {
  window.__ANT_ICONS_VERSION__ = version;
}

// Ensure IconProvider has access to version
if (typeof IconProvider !== 'undefined' && !IconProvider.version) {
  IconProvider.version = version;
}
        `;

        return {
          code: injection + code,
          map: null
        };
      }

      return null;
    }
  };
};

// Create a custom plugin that handles missing Ant Design icon SVG modules
const handleMissingModulesPlugin = () => {
  // Track processed icon paths to avoid duplicates
  const processedIcons = new Set();
  // Store build mode
  let isBuild = false;

  return {
    name: 'handle-missing-modules',

    configResolved(config) {
      // Store whether we're in build mode
      isBuild = config.command === 'build';
      console.log(`[AntDesignPlugin] Running in ${isBuild ? 'build' : 'development'} mode`);
    },

    // Specifically target all ant-design icon SVG paths
    resolveId(id, importer) {
      if (id.includes('@ant-design/icons-svg/es/asn/')) {
        const iconName = id.split('/').pop().replace(/\.\w+$/, '');

        // Avoid logging duplicates
        if (!processedIcons.has(iconName)) {
          processedIcons.add(iconName);
          console.log(`[AntDesignPlugin] Resolving: ${iconName} from ${importer}`);
        }

        // Create a virtual module ID that our load hook will recognize
        // Use null for id to let other plugins resolve it
        return {
          id: `\0virtual:ant-icon:${iconName}`,
          moduleSideEffects: false
        };
      }

      return null;
    },

    // Add a load hook to provide empty implementations if needed
    load(id) {
      // Handle our virtual module IDs from resolveId
      if (id.startsWith('\0virtual:ant-icon:')) {
        const iconName = id.slice('\0virtual:ant-icon:'.length);

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

// Custom plugin to ensure Ant Icons compatibility
const antIconsCompatibilityPlugin = {
  name: 'ant-icons-compatibility',
  enforce: 'pre',
  config(config) {
    // Make sure ant icons can be built in a compatible way
    if (config.build && !config.build.ssr) {
      config.build.target = ['es2015', 'chrome60'];
    }
  }
};

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache', // Use a specific cache directory we can control
  plugins: [
    antIconsCompatibilityPlugin,
    react(),
    handleMissingModulesPlugin(),
    patchAntDesignPlugin(),
    // Use our version injection plugin
    injectVersionPlugin(),
    directPatchPlugin()
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
      'classnames': path.resolve(__dirname, 'node_modules/classnames/index.js'),
      '@ant-design/icons-svg/es/asn': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
      'react-is': path.resolve(__dirname, 'src/utils/react-is-shim.js')
    },
  },
  define: {
    // Define global variables to ensure the version is always available
    '__ANT_ICONS_VERSION__': JSON.stringify('4.2.1'),
    // Add a global fallback for IconProvider.version
    'window.__ANT_DESIGN_ICONS_VERSION__': JSON.stringify('4.2.1')
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure output is compatible with older browsers
    target: 'es2015',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: ['three'], // Removed '@ant-design/icons' from external
      output: {
        // Use more consistent file names
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          // Create a dedicated chunk for Ant Icons that's easy to identify
          if (id.includes('@ant-design/icons')) {
            return 'ant-icons';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          if (id.includes('antd')) {
            return 'antd';
          }
          // Return undefined for other modules
          return undefined;
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        }
      }
    },
    assetsInlineLimit: 4096,
    copyPublicDir: true, // Make sure public files are copied
  },
  optimizeDeps: {
    exclude: ['@ant-design/icons-svg', '@ant-design/icons'],
    include: ['classnames'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      format: 'esm',
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
});
