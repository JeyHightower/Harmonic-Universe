/**
 * This script updates the index.html file to include the React fixes scripts
 * with the correct path and ensures proper MIME types.
 */
const fs = require('fs');
const path = require('path');

// Path to the static directory
const staticDir = process.argv[2] || '../backend/static';
const indexPath = path.join(staticDir, 'index.html');

console.log(`Looking for index.html at: ${indexPath}`);

if (!fs.existsSync(indexPath)) {
  console.error(`Error: index.html not found at ${indexPath}`);
  process.exit(1);
}

// Read the HTML file
let html = fs.readFileSync(indexPath, 'utf8');
console.log('Reading index.html...');

// Check if React fixes are already in the HTML
if (html.includes('react-fix-loader.js')) {
  console.log('React fixes already present in index.html');
} else {
  // Create the script tags to add - place these BEFORE any module scripts
  const reactFixesScripts = `
<!-- React fixes for module loading and MIME types -->
<!-- Preload React to ensure it's available before module scripts -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

<!-- React fixes loader with multiple fallbacks -->
<script>
  // Ensure React global availability
  window.React = window.React || {
    createElement: function(type, props, ...children) { return { type, props: props || {}, children }; },
    createContext: function() { return { Provider: function(props) { return props.children; } }; },
    Fragment: Symbol('React.Fragment')
  };
  
  // Ensure JSX runtime compatibility
  window.jsx = window.jsx || window.React.createElement;
  window.jsxs = window.jsxs || window.React.createElement;
  
  // Log for diagnostic purposes
  console.log('React globals initialized from inline script');
  
  // Load react-fix-loader.js with error handling
  const loadReactFixes = function() {
    const script = document.createElement('script');
    script.src = '/static/react-fixes/react-fix-loader.js';
    script.onerror = function() {
      console.warn('Failed to load react-fix-loader.js, falling back to inline fix');
      // Apply fixes directly if script fails to load
      if (typeof React === 'undefined') {
        console.warn('React still not found after fallback, applying emergency polyfill');
        window.React = {
          createElement: function(type, props, ...children) { return { type, props: props || {}, children }; },
          createContext: function() { return { Provider: function(props) { return props.children; } }; },
          Fragment: Symbol('React.Fragment')
        };
        window.jsx = window.React.createElement;
        window.jsxs = window.React.createElement;
      }
    };
    document.head.appendChild(script);
  };
  
  // Wait for document to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReactFixes);
  } else {
    loadReactFixes();
  }
</script>`;

  // Find the closing head tag to insert our scripts right before it
  // This ensures they're loaded before any module scripts in the body
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${reactFixesScripts}\n</head>`);
  }
  // If no head tag found, add after opening html tag
  else if (html.includes('<html')) {
    const htmlTagEnd = html.indexOf('>', html.indexOf('<html')) + 1;
    html = html.slice(0, htmlTagEnd) +
      `\n<head>${reactFixesScripts}\n</head>\n` +
      html.slice(htmlTagEnd);
  }
  // Last resort: add at the beginning of the file
  else {
    html = `<!DOCTYPE html>\n<html>\n<head>${reactFixesScripts}\n</head>\n<body>\n` + html + '\n</body>\n</html>';
  }

  // Write the updated HTML back to the file
  fs.writeFileSync(indexPath, html);
  console.log(`Updated index.html (${html.length} bytes) with React fixes`);

  // Log success and exit
  console.log('Successfully updated index.html with React fixes');
  process.exit(0);
}

// Also create a base.html with the fixes for fallback
const baseHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <meta http-equiv="Content-Type" content="text/javascript; charset=utf-8">
  <script src="/static/react-fixes/react-fix-loader.js"></script>
</head>
<body>
  <div id="root">
    <h1>Harmonic Universe</h1>
    <p>Loading application...</p>
  </div>
  <script>
    // Check if React fixes are working
    document.addEventListener('DOMContentLoaded', function() {
      console.log('React fixes loaded:', typeof window.React !== 'undefined');
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(staticDir, 'base.html'), baseHtml);
console.log('Created base.html with React fixes');

console.log('Update completed successfully!'); 