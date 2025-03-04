import fs from 'fs';
import path from 'path';

/**
 * This plugin patches problematic Ant Design files at build time
 */
export default function patchAntDesignPlugin() {
    let isBuild = false;

    return {
        name: 'patch-antd-icons',

        configResolved(config) {
            isBuild = config.command === 'build';
            console.log(`[patchAntDesignPlugin] Initialized in ${isBuild ? 'build' : 'development'} mode`);
        },

        config(config) {
            // Only modify these settings if they don't already exist
            if (!config.build) {
                config.build = {};
            }

            if (!config.build.rollupOptions) {
                config.build.rollupOptions = {};
            }

            // Ensure rollupOptions.output exists and has preserveEntrySignatures set to 'strict'
            if (!config.build.rollupOptions.output) {
                config.build.rollupOptions.output = {};
            }

            // Make sure preserveEntrySignatures is 'strict' when preserveModules is true
            if (config.build.rollupOptions.output.preserveModules) {
                config.build.rollupOptions.output.preserveEntrySignatures = 'strict';
            }

            if (!config.build.rollupOptions.external) {
                // This is a regex pattern that matches all problematic icon paths
                config.build.rollupOptions.external = [/.*@ant-design\/icons-svg\/es\/asn\/.*/];
            }

            // Make sure to exclude @ant-design/icons-svg from optimization
            if (!config.optimizeDeps) {
                config.optimizeDeps = {};
            }

            if (!config.optimizeDeps.exclude) {
                config.optimizeDeps.exclude = [];
            }

            if (!config.optimizeDeps.exclude.includes('@ant-design/icons-svg')) {
                config.optimizeDeps.exclude.push('@ant-design/icons-svg');
            }

            // Add more specific path handling for build mode
            if (config.resolve && !config.resolve.alias) {
                config.resolve.alias = {};
            }

            if (config.resolve && !config.resolve.alias['@ant-design/icons-svg/es/asn']) {
                config.resolve.alias['@ant-design/icons-svg/es/asn'] = path.resolve(process.cwd(), 'src/utils/ant-icons-shim.js');
            }

            return config;
        },

        transform(code, id) {
            // Skip transformation if id doesn't include '@ant-design/icons'
            if (!id.includes('@ant-design/icons')) {
                return null;
            }

            // Only apply transformation in build mode for certain files
            if (isBuild) {
                // Handle specific icon import transformations during build
                if (id.includes('node_modules/@ant-design/icons/') && code.includes('@ant-design/icons-svg/es/asn/')) {
                    console.log(`[patchAntDesignPlugin] Transforming imports in: ${id}`);

                    // Replace problematic imports with shim imports
                    const transformedCode = code.replace(
                        /import\s+(\w+)\s+from\s+["']@ant-design\/icons-svg\/es\/asn\/([^"']+)["'];/g,
                        (match, importName, iconName) => {
                            return `/* Replaced import */\nconst ${importName} = {
                                name: '${iconName}',
                                theme: '${iconName.includes('Filled') ? 'filled' : iconName.includes('TwoTone') ? 'twotone' : 'outlined'}',
                                icon: {
                                    tag: 'svg',
                                    attrs: { viewBox: '64 64 896 896' },
                                    children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
                                }
                            };`;
                        }
                    );

                    return {
                        code: transformedCode,
                        map: null
                    };
                }
            }

            return null;
        },

        configureServer(server) {
            // Handle virtual modules during development
            server.middlewares.use((req, res, next) => {
                // Intercept requests for ant-design icon SVG paths
                if (req.url && req.url.includes('@ant-design/icons-svg/es/asn/')) {
                    const iconName = req.url.split('/').pop().replace(/\.\w+$/, '');
                    console.log(`[patchAntDesignPlugin] Serving virtual module for: ${iconName}`);

                    // Determine icon theme based on name
                    let theme = 'outlined'; // default
                    if (iconName.includes('Filled')) {
                        theme = 'filled';
                    } else if (iconName.includes('TwoTone')) {
                        theme = 'twotone';
                    }

                    // Serve a minimal SVG icon implementation
                    res.setHeader('Content-Type', 'application/javascript');
                    res.end(`
                        export default {
                            name: '${iconName}',
                            theme: '${theme}',
                            icon: {
                                tag: 'svg',
                                attrs: { viewBox: '64 64 896 896' },
                                children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
                            }
                        };
                    `);
                    return;
                }

                next();
            });
        }
    };
}
