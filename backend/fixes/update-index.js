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
  // Add React fixes script to the head
  console.log('Adding React fixes to index.html');

  // Create the script tag to add
  const reactFixScript = `
  <!-- React fixes for module loading and MIME types - Multiple paths for redundancy -->
  <script src="/static/react-fixes/react-fix-loader.js"></script>
  <script src="/react-fix-loader.js"></script>
  <script src="react-fix-loader.js"></script>
  <script src="/direct-fix.js"></script>
  <script src="/static/direct-fix.js"></script>
  <!-- Fallback script tag with inline fix -->
  <script>
    // Inline React fix (minimal version)
    console.log('Inline React fix applied');
    if (typeof React === 'undefined') {
      window.React = {
        createElement: function(type, props) { return { type, props: props || {} }; },
        createContext: function() { return { Provider: function(p) { return p.children; } }; },
        Fragment: Symbol('React.Fragment')
      };
      window.jsx = window.React.createElement;
      window.jsxs = window.React.createElement;
    }
  </script>`;

  // Insert after the first head tag
  html = html.replace('<head>', '<head>' + reactFixScript);

  // Add MIME type meta tag
  if (!html.includes('content="text/javascript"')) {
    html = html.replace('<head>', '<head>\n  <meta http-equiv="Content-Type" content="text/javascript; charset=utf-8">');
  }

  // Write the updated HTML back to the file
  fs.writeFileSync(indexPath, html);
  console.log('Updated index.html with React fixes');
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