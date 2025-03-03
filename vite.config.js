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
        },
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
});
