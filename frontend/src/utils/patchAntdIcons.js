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
            console.log('[patchAntDesignPlugin] Plugin initialized');
        },

        config(config) {
            if (!config.build) {
                config.build = {};
            }

            if (!config.build.rollupOptions) {
                config.build.rollupOptions = {};
            }

            if (!config.build.rollupOptions.external) {
                config.build.rollupOptions.external = [];
            }

            // Add icon SVG paths to external with a more aggressive pattern
            const external = config.build.rollupOptions.external;
            if (Array.isArray(external)) {
                external.push(/.*@ant-design\/icons-svg\/es\/asn\/.*/);
            } else if (typeof external === 'string' || external instanceof RegExp) {
                config.build.rollupOptions.external = [external, /.*@ant-design\/icons-svg\/es\/asn\/.*/];
            } else {
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

            // Ensure all ant-design icon SVG paths are marked as external
            if (config.build && !config.build.rollupOptions) {
                config.build.rollupOptions = {};
            }

            if (config.build && !config.build.rollupOptions.external) {
                config.build.rollupOptions.external = [];
            }

            // Use a regex pattern to match all @ant-design/icons-svg paths
            const iconPathsPattern = /.*@ant-design\/icons-svg\/es\/asn\/.*/;

            if (config.build && Array.isArray(config.build.rollupOptions.external)) {
                if (!config.build.rollupOptions.external.some(ext =>
                    ext instanceof RegExp && ext.toString() === iconPathsPattern.toString())) {
                    config.build.rollupOptions.external.push(iconPathsPattern);
                }
            }

            return config;
        },

        transform(code, id) {
            // Only patch during build
            if (!isBuild) return null;

            // Check if this is the problematic AntdIcon.js file
            if (id.includes('node_modules/@ant-design/icons') && id.endsWith('AntdIcon.js')) {
                console.log(`Patching Ant Design icon file: ${id}`);

                // Use our patched version instead of the original
                const patchedPath = path.resolve(process.cwd(), 'src/patches/AntdIcon.js');

                if (fs.existsSync(patchedPath)) {
                    const patchedContent = fs.readFileSync(patchedPath, 'utf-8');
                    return {
                        code: patchedContent,
                        map: null
                    };
                } else {
                    console.warn(`Patched file not found: ${patchedPath}`);
                }
            }

            // Handle any imports of @ant-design/icons-svg directly in code
            if (code.includes('@ant-design/icons-svg/es/asn/')) {
                console.log(`Patching code with Ant Design icon imports: ${id}`);

                // Replace imports with empty objects
                const patchedCode = code.replace(
                    /import\s+([^"']+)\s+from\s+["']@ant-design\/icons-svg\/es\/asn\/([^"']+)["'];?/g,
                    (match, importName, iconName) => {
                        return `const ${importName} = {
                            name: '${iconName}',
                            theme: 'outlined',
                            icon: {
                                tag: 'svg',
                                attrs: { viewBox: '64 64 896 896' },
                                children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
                            }
                        };`;
                    }
                );

                if (patchedCode !== code) {
                    return {
                        code: patchedCode,
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
