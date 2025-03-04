import fs from 'fs';
import path from 'path';

/**
 * This plugin patches problematic Ant Design files at build time
 */
export default function patchAntDesignPlugin() {
    let isBuild = false;
    // Track processed files to avoid redundant work
    const processedFiles = new Set();

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

            // Ensure rollupOptions.output exists
            if (!config.build.rollupOptions.output) {
                config.build.rollupOptions.output = {};
            }

            // Make sure preserveEntrySignatures is 'strict' when preserveModules is true
            if (config.build.rollupOptions.output.preserveModules) {
                config.build.rollupOptions.output.preserveEntrySignatures = 'strict';
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
            if (!config.resolve) {
                config.resolve = {};
            }

            if (!config.resolve.alias) {
                config.resolve.alias = {};
            }

            // Set up alias for icon paths
            config.resolve.alias['@ant-design/icons-svg/es/asn'] = path.resolve(process.cwd(), 'src/utils/ant-icons-shim.js');

            return config;
        },

        transform(code, id) {
            // Only consider files that include '@ant-design/icons' and contain problematic imports
            if (!id.includes('@ant-design/icons') || !code.includes('@ant-design/icons-svg/es/asn/')) {
                return null;
            }

            // Only process each file once
            if (processedFiles.has(id)) {
                return null;
            }

            // Mark file as processed
            processedFiles.add(id);

            console.log(`[patchAntDesignPlugin] Transforming imports in: ${id}`);

            // Extract the icon name from the file path
            const fileName = path.basename(id, '.js');

            // First, completely remove the problematic import lines
            let transformedCode = code.replace(
                /import\s+(\w+)\s+from\s+["']@ant-design\/icons-svg\/es\/asn\/([^"']+)["'];/g,
                '// Removed problematic import'
            );

            // Determine icon theme based on name
            let theme = 'outlined'; // default
            if (fileName.includes('Filled')) {
                theme = 'filled';
            } else if (fileName.includes('TwoTone')) {
                theme = 'twotone';
            }

            // Find a good position to insert our replacement - before any function/class/variable definition
            const insertPos = transformedCode.search(/var\s|function\s|class\s|const\s|let\s|import\s/);

            if (insertPos !== -1) {
                // Create a replacement for the SVG variable
                const svgVarName = fileName + 'Svg';
                const replacementCode = `
/* Added by patchAntDesignPlugin */
const ${svgVarName} = {
  name: '${fileName}',
  theme: '${theme}',
  icon: {
    tag: 'svg',
    attrs: { viewBox: '64 64 896 896' },
    children: [{ tag: 'path', attrs: { d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z' } }]
  }
};

`;
                // Insert our replacement at the beginning of the file
                transformedCode = replacementCode + transformedCode;
            }

            // If code was changed, return the transformed version
            if (transformedCode !== code) {
                return {
                    code: transformedCode,
                    map: null
                };
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
