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

<!-- CRITICAL: Immediate JSX Runtime Implementation -->
<script>
  console.log('Immediate JSX runtime implementation executing');
  
  // CRITICAL: Define jsx/jsxs functions in the global scope IMMEDIATELY
  window.jsx = function jsx(type, props, key) {
    // Basic implementation that matches React's jsx function
    return window.React.createElement(
      type,
      Object.assign(key !== undefined ? {key: key} : {}, props || {}),
      props && props.children
    );
  };
  
  // jsxs is the same function in practice
  window.jsxs = window.jsx;
  
  // Define Fragment
  window.Fragment = window.React ? window.React.Fragment : Symbol('Fragment');
  
  // Verify the functions are defined
  console.log('JSX runtime functions defined:', {
    jsx: typeof window.jsx === 'function',
    jsxs: typeof window.jsxs === 'function',
    Fragment: window.Fragment ? 'defined' : 'undefined'
  });
  
  // Expose as a module-like object
  window._jsx_runtime = {
    jsx: window.jsx,
    jsxs: window.jsxs,
    Fragment: window.Fragment
  };
  
  // Create mock module.exports for CommonJS-like environments
  if (typeof module === 'undefined') {
    window.module = { exports: window._jsx_runtime };
  } else {
    module.exports = window._jsx_runtime;
  }
</script>

<!-- Import override for jsx-runtime -->
<script type="module">
  // Intercept imports for jsx-runtime
  window.__originalImport = window.import || (() => Promise.reject(new Error('import not available')));
  
  window.import = function(specifier) {
    console.log('Import intercepted:', specifier);
    
    // Handle jsx runtime imports specifically
    if (specifier.includes('jsx-runtime') || specifier.includes('jsx-dev-runtime')) {
      console.log('Providing synthetic JSX runtime for:', specifier);
      return Promise.resolve({
        jsx: window.jsx,
        jsxs: window.jsxs,
        Fragment: window.Fragment,
        jsxDEV: window.jsx
      });
    }
    
    // Fall back to original import
    return window.__originalImport(specifier);
  };
  
  // Pre-define paths that might be used by bundlers
  const jsxRuntimePaths = [
    '/jsx-runtime/jsx-runtime.js',
    '/node_modules/react/jsx-runtime.js',
    'react/jsx-runtime',
    '/jsx-runtime.js',
    'jsx-runtime'
  ];
  
  // Create import maps for these paths if supported
  if (document.createElement('script').importMap !== undefined) {
    const importMap = {
      imports: {}
    };
    
    jsxRuntimePaths.forEach(path => {
      importMap.imports[path] = 'data:application/javascript;charset=utf-8,export const jsx = window.jsx; export const jsxs = window.jsxs; export const Fragment = window.Fragment; export default { jsx, jsxs, Fragment };';
    });
    
    const importMapScript = document.createElement('script');
    importMapScript.type = 'importmap';
    importMapScript.textContent = JSON.stringify(importMap);
    document.head.appendChild(importMapScript);
    console.log('Added import map for JSX runtime paths');
  }
</script>

<!-- Error monitoring for resource loading failures -->
<script>
  // Error monitoring for resource loading failures
  window.addEventListener('error', function(e) {
    if (e.target && (e.target.src || e.target.href)) {
      console.error('Resource failed to load:', e.target.src || e.target.href);
      
      // Log additional details that might help troubleshooting
      console.error('Resource type:', e.target.tagName);
      console.error('Resource attributes:', Object.fromEntries(
        [...e.target.attributes].map(attr => [attr.name, attr.value])
      ));
    }
  }, true);

  // Ensure React global availability
  window.React = window.React || {
    createElement: function(type, props, ...children) { return { type, props: props || {}, children }; },
    createContext: function() { return { Provider: function(props) { return props.children; } }; },
    Fragment: Symbol('React.Fragment')
  };
  
  // Double-check JSX runtime compatibility
  window.jsx = window.jsx || window.React.createElement;
  window.jsxs = window.jsxs || window.React.createElement;
  
  console.log('React and JSX runtime available:', {
    React: !!window.React,
    jsx: !!window.jsx,
    jsxs: !!window.jsxs
  });
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