const fs = require('fs');
const path = require('path');

// Get the dist directory
const distDir = path.resolve(__dirname, '../dist');
const assetsDir = path.join(distDir, 'assets');

// Find the ant-icons bundle
const findAntIconsBundle = () => {
    try {
        const files = fs.readdirSync(assetsDir);
        const iconBundle = files.find(file => file.includes('ant-icons') && file.endsWith('.js'));
        return iconBundle ? path.join(assetsDir, iconBundle) : null;
    } catch (e) {
        console.error('Error finding ant-icons bundle:', e);
        return null;
    }
};

// Fix the ant-icons bundle
const fixAntIconsBundle = (bundlePath) => {
    if (!bundlePath) {
        console.log('No ant-icons bundle found');
        return;
    }

    try {
        console.log(`Fixing ${bundlePath}...`);
        let content = fs.readFileSync(bundlePath, 'utf8');

        // Add a version assignment at the beginning
        const patchedContent = `
// Ensure version is defined
var ANT_ICONS_VERSION = "4.2.1";

// Add safety for context access
function createSafeContext(React) {
  try {
    return (React && React.createContext) ? React.createContext({}) : {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children({}); }
    };
  } catch (e) {
    console.error("Error creating context:", e);
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children({}); }
    };
  }
}

// Global patches
if (typeof window !== 'undefined') {
  window.__ANT_ICONS_VERSION__ = ANT_ICONS_VERSION;
  window.createSafeContext = createSafeContext;
}

${content}`;

        fs.writeFileSync(bundlePath, patchedContent);
        console.log(`Successfully patched ${bundlePath}`);
    } catch (e) {
        console.error('Error patching ant-icons bundle:', e);
    }
};

// Run the fix
const bundlePath = findAntIconsBundle();
fixAntIconsBundle(bundlePath);

console.log('Asset preparation complete');
