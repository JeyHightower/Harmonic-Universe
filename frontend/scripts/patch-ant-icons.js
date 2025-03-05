const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all ant-icons chunk files in the dist directory
console.log('Searching for Ant Design icon chunks...');
const antIconsFiles = glob.sync('dist/assets/ant-icons-*.js');

if (antIconsFiles.length === 0) {
    console.error('No Ant Design icon chunks found!');
    process.exit(1);
}

antIconsFiles.forEach(file => {
    console.log(`Patching ${file}...`);

    let content = fs.readFileSync(file, 'utf8');

    // Find and fix any undefined.version references
    if (content.includes('.version')) {
        // Pattern 1: Check for IconProvider.version
        if (content.includes('IconProvider.version')) {
            content = content.replace(
                /IconProvider\.version/g,
                '(IconProvider && IconProvider.version || "4.2.1")'
            );
        }

        // Pattern 2: Check for other undefined.version patterns
        content = content.replace(
            /(\w+)\.version/g,
            '($1 && $1.version || "4.2.1")'
        );

        // Add a global version fallback
        const versionFallback = `
// Global version fallback for Ant Design Icons
window.__ANT_ICONS_VERSION__ = "4.2.1";
var version = "4.2.1";
`;

        content = versionFallback + content;

        fs.writeFileSync(file, content);
        console.log(`✅ Patched ${file}`);
    } else {
        console.log(`⚠️ No version references found in ${file}`);
    }
});

console.log('Patching complete!');
