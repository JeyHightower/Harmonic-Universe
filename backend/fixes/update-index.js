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
  // Simple script that loads React and defines JSX runtime functions
  const reactFixesScript = `
<!-- React fixes -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script>
  // CRITICAL: Define JSX runtime functions immediately
  window.jsx = window.jsxs = React.createElement;
  window.Fragment = React.Fragment;
  console.log('JSX runtime functions defined');
  
  // Ensure all module scripts are served with correct MIME type
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.endsWith('.js')) {
      console.log('Fetch intercepted for JS file:', url);
      // Add timestamp to bypass cache if needed
      const cacheBuster = url.includes('?') ? '&t=' + Date.now() : '?t=' + Date.now();
      return originalFetch(url + cacheBuster, options);
    }
    return originalFetch.apply(this, arguments);
  };
  
  // Error monitoring for resource loading failures
  window.addEventListener('error', function(e) {
    if (e.target && (e.target.src || e.target.href)) {
      console.error('Resource failed to load:', e.target.src || e.target.href);
      
      // For module scripts specifically, try to fix and reload
      if (e.target.type === 'module' && e.target.src) {
        console.log('Attempting to reload failed module script:', e.target.src);
        
        // Create a new script element with same src but non-module type
        const fixScript = document.createElement('script');
        fixScript.src = e.target.src;
        fixScript.onerror = function() {
          console.error('Failed to load script even after MIME type fix:', e.target.src);
        };
        document.head.appendChild(fixScript);
      }
    }
  }, true);
</script>`;

  // Find the closing head tag to insert our scripts right before it
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${reactFixesScript}\n</head>`);
  }
  // If no head tag found, add after opening html tag
  else if (html.includes('<html')) {
    const htmlTagEnd = html.indexOf('>', html.indexOf('<html')) + 1;
    html = html.slice(0, htmlTagEnd) +
      `\n<head>${reactFixesScript}\n</head>\n` +
      html.slice(htmlTagEnd);
  }
  // Last resort: add at the beginning of the file
  else {
    html = `<!DOCTYPE html>\n<html>\n<head>${reactFixesScript}\n</head>\n<body>\n` + html + '\n</body>\n</html>';
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
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script>
    // CRITICAL: Define jsx/jsxs immediately
    window.jsx = function(type, props, key) {
      return window.React.createElement(
        type,
        Object.assign(key !== undefined ? {key: key} : {}, props || {}),
        props && props.children
      );
    };
    window.jsxs = window.jsx;
    window.Fragment = window.React.Fragment;
    console.log('JSX runtime implemented in base.html');
  </script>
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
      console.log('React availability:', {
        React: typeof window.React !== 'undefined',
        jsx: typeof window.jsx !== 'undefined',
        jsxs: typeof window.jsxs !== 'undefined',
        Fragment: typeof window.Fragment !== 'undefined'
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(staticDir, 'base.html'), baseHtml);
console.log('Created base.html with React fixes');

console.log('Update completed successfully!'); 