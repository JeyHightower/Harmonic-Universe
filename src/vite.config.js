import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import patchAntDesignPlugin from './src/utils/patchAntdIcons';

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
            'classnames': path.resolve(__dirname, 'node_modules/classnames/index.js'),
            // Add an alias for the problematic paths to our shim
            '@ant-design/icons-svg/es/asn': path.resolve(__dirname, 'src/utils/ant-icons-shim.js'),
            // Add alias for react-is to use our compatibility shim
            'react-is': path.resolve(__dirname, 'src/utils/react-is-shim.js')
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
            // Don't mark ant-design paths as external to prevent build errors
            // since we're handling them with our virtual modules
            output: {
                // Try an alternative bundling strategy
                // Instead of preserveModules, use manualChunks for better control
                manualChunks: {
                    'vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                        'antd',
                    ],
                    'ant-design-icons': [
                        '@ant-design/icons',
                    ],
                },
                // Add globals for external imports
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                }
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
