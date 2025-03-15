import path from 'path';

/**
 * This plugin patches problematic Ant Design files at build time
 * It handles missing SVG icons by providing virtual modules with standardized formats
 */
export default function patchAntDesignPlugin() {
    // Track which files we've already processed
    const processedFiles = new Set();

    return {
        name: 'patch-antd-icons',
        // Run this before other plugins
        enforce: 'pre',

        // Called once when Vite config is resolved
        configResolved(config) {
            console.log('[PatchAntdIcons] Plugin initialized');
        },

        // This transform hook intercepts and patches imported icon files
        transform(code, id) {
            // Only process files from ant-design/icons that import SVG files
            if (
                !id.includes('@ant-design/icons') ||
                !(
                    code.includes('@ant-design/icons-svg/es/asn/') ||
                    code.includes('@ant-design/icons-svg/lib/asn/') ||
                    code.includes('@ant-design/icons-svg/es/') ||
                    code.includes('@ant-design/icons-svg/lib/')
                )
            ) {
                return null;
            }

            // Only process each file once for efficiency
            if (processedFiles.has(id)) {
                return null;
            }

            // Mark this file as processed
            processedFiles.add(id);

            console.log(`[PatchAntdIcons] Patching imports in: ${path.basename(id)}`);

            // Extract the icon name from the file path
            const iconName = path.basename(id, path.extname(id)).replace(/\.\w+$/, '');

            // Replace all problematic imports with our shim
            let patchedCode = code.replace(
                /import \w+Svg from ['"]@ant-design\/icons-svg\/(es|lib)(\/asn)?\/[^'"]+['"]/g,
                `import { getIcon } from '@/utils/ant-icons-shim'; const ${iconName}Svg = getIcon('${iconName}')`
            );

            // Ensure we're exporting the right module format
            patchedCode = patchedCode.replace(
                /export default \w+;/,
                `export default ${iconName}; export const __esModule = true;`
            );

            return {
                code: patchedCode,
                map: null // No source map needed for this transformation
            };
        }
    };
}
