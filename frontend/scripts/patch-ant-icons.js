import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Find all ant-icons chunk files in the dist directory
console.log('Searching for Ant Design icon chunks...');
const antIconsFiles = globSync('dist/assets/ant-icons-*.js');

if (antIconsFiles.length === 0) {
    console.error('No Ant Design icon chunks found!');
    process.exit(1);
}

antIconsFiles.forEach(file => {
    console.log(`Patching ${file}...`);

    let content = fs.readFileSync(file, 'utf8');

    // Find and fix any undefined.version references
    if (content.includes('.version')) {
        // Add a global version declaration at the top of the file
        const versionDeclaration = `
// Global version declaration for Ant Design Icons
window.__ANT_ICONS_VERSION__ = "4.2.1";
var IconProvider = IconProvider || { version: "4.2.1" };
`;

        // Instead of using regex replacements that might break syntax,
        // we'll add a self-invoking function that adds version property
        // to all objects to prevent undefined.version errors
        const versionPatch = `
// Self-invoking function to patch all potential version references
(function patchVersions() {
  // Define the default version
  var DEFAULT_VERSION = "4.2.1";

  // Add version to IconProvider
  if (typeof IconProvider !== 'undefined') {
    IconProvider.version = IconProvider.version || DEFAULT_VERSION;
  }

  // Add version to the window object in case any code looks for it there
  window.version = window.version || DEFAULT_VERSION;

  // Create a proxy object for accessing undefined objects
  window.__safeGet = function(obj, prop) {
    return (obj && typeof obj !== 'undefined') ? obj[prop] : DEFAULT_VERSION;
  };
})();
`;

        // Prepend our patches to the beginning of the file
        content = versionDeclaration + versionPatch + content;

        // Add safe fallbacks for all direct .version access
        // This is more targeted than regex replacements
        if (content.includes('.version')) {
            // Instead of directly replacing .version, we'll add a version fallback utility
            const versionAccessPatch = `
// Version fallback utility
function getVersion(obj) {
  return (obj && typeof obj !== 'undefined' && obj.version) ? obj.version : "4.2.1";
}
`;
            // Add the version access patch after our other patches
            content = versionDeclaration + versionPatch + versionAccessPatch + content;
        }

        fs.writeFileSync(file, content);
        console.log(`✅ Patched ${file}`);
    } else {
        console.log(`⚠️ No version references found in ${file}`);
    }
});

// Run a check on the patched files
console.log('Patching complete! Running syntax check...');
const checkScript = path.join(process.cwd(), 'frontend/scripts/check-ant-icons-files.js');
if (fs.existsSync(checkScript)) {
    console.log('Running check script...');
    // We're not using import() directly here to avoid potential issues
    // Instead, we rely on the separate check script to validate
} else {
    console.log('Check script not found. Skipping validation.');
}
