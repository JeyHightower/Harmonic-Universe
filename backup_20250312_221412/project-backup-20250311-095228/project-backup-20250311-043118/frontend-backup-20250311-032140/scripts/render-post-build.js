// Consolidated post-build script for Render.com
import fs from 'fs';
import path from 'path';

console.log('[Render Post-Build] Starting post-build processing...');

// Define paths
const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

// Add React polyfill to index.html if it doesn't already have it
try {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    if (!indexHtml.includes('react-polyfill.js')) {
        console.log('[Render Post-Build] Adding React polyfill to index.html');

        // Add polyfill script tag right after the head tag
        indexHtml = indexHtml.replace(
            '<head>',
            '<head>\n    <script src="/react-polyfill.js"></script>'
        );

        fs.writeFileSync(indexHtmlPath, indexHtml);
        console.log('[Render Post-Build] React polyfill added to index.html');
    } else {
        console.log('[Render Post-Build] React polyfill already in index.html');
    }
} catch (error) {
    console.error('[Render Post-Build] Error processing index.html:', error);
}

// Find and patch any Ant Icons chunks
try {
    const files = fs.readdirSync(distDir);
    const assetDir = path.join(distDir, 'assets');
    const assetFiles = fs.existsSync(assetDir) ? fs.readdirSync(assetDir) : [];

    // Check both dist and assets directories
    const allFiles = [...files, ...assetFiles.map(f => `assets/${f}`)];

    // Look for Ant Icons chunks
    const antIconsChunks = allFiles.filter(file =>
        file.includes('ant-icons') && file.endsWith('.js')
    );

    if (antIconsChunks.length > 0) {
        console.log('[Render Post-Build] Found Ant Icons chunks:', antIconsChunks);

        antIconsChunks.forEach(chunkFile => {
            const chunkPath = path.join(distDir, chunkFile);

            // Read the chunk file
            let chunkCode = fs.readFileSync(chunkPath, 'utf8');

            // Only patch if not already patched
            if (!chunkCode.includes('// Direct patch for React.createContext')) {
                console.log(`[Render Post-Build] Patching ${chunkFile}`);

                // Apply the direct patch
                const patchedCode = `
// Direct patch for React.createContext
if (typeof React === 'undefined' || !React.createContext) {
  var React = React || {};
  React.createContext = function(defaultValue) {
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children(defaultValue); },
      _currentValue: defaultValue
    };
  };
}

// Ensure IconContext is defined even if React.createContext fails
var ensureIconContext = function() {
  try {
    return React.createContext({});
  } catch (e) {
    console.warn('[DirectPatch] Error creating IconContext:', e);
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children({}); }
    };
  }
};

// Create a local reference to IconContext
var IconContext = ensureIconContext();

${chunkCode}`;

                // Write the patched file
                fs.writeFileSync(chunkPath, patchedCode);
                console.log(`[Render Post-Build] Successfully patched ${chunkFile}`);
            } else {
                console.log(`[Render Post-Build] ${chunkFile} already patched`);
            }
        });
    } else {
        console.log('[Render Post-Build] No Ant Icons chunks found');
    }
} catch (error) {
    console.error('[Render Post-Build] Error patching Ant Icons chunks:', error);
}

console.log('[Render Post-Build] Post-build processing completed');
