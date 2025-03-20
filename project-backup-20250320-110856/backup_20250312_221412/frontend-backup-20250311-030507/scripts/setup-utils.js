const fs = require('fs');
const path = require('path');

const utilsDir = path.join(process.cwd(), 'src', 'utils');
const reactFixesDir = path.join(process.cwd(), 'static', 'react-fixes');

// Create directories
fs.mkdirSync(utilsDir, { recursive: true });
fs.mkdirSync(reactFixesDir, { recursive: true });

// Utility file contents
const files = {
    'ensure-react-dom.js': `
/**
 * Ensures ReactDOM is available and properly configured
 */
(function() {
  if (!window.ReactDOM) {
    console.warn('[ReactDOM Fix] ReactDOM not found, creating polyfill');
    window.ReactDOM = {
      version: '16.8.0',
      render: function(element, container) {
        console.warn('[ReactDOM Fix] Using polyfill render');
        if (container) container.innerHTML = '<div>React rendering not available</div>';
      },
      createRoot: function(container) {
        console.warn('[ReactDOM Fix] Using polyfill createRoot');
        return {
          render: function(element) {
            if (container) container.innerHTML = '<div>React root rendering not available</div>';
          }
        };
      }
    };
  }

  console.log('[ReactDOM Fix] ReactDOM fixes applied');
})();`,

    'ensure-redux-provider.js': `
/**
 * Ensures Redux Provider is available and properly configured
 */
(function() {
  if (!window.ReactRedux) {
    console.warn('[Redux Fix] React-Redux not found, creating minimal Provider');
    window.ReactRedux = {
      Provider: function(props) {
        console.warn('[Redux Fix] Using minimal Provider');
        return props.children;
      }
    };
  }

  console.log('[Redux Fix] Redux Provider fixes applied');
})();`,

    'ensure-router-provider.js': `
/**
 * Ensures Router Provider is available and properly configured
 */
(function() {
  if (!window.ReactRouter) {
    console.warn('[Router Fix] React Router not found, creating minimal router');
    window.ReactRouter = {
      BrowserRouter: function(props) {
        console.warn('[Router Fix] Using minimal Router');
        return props.children;
      }
    };
  }

  console.log('[Router Fix] Router Provider fixes applied');
})();`,

    'react-diagnostics.js': `
/**
 * React diagnostics module - helps diagnose context issues
 */

window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};
window.__REACT_HOOKS = window.__REACT_HOOKS || {};

export function registerContext(name, context) {
  if (window.__REACT_CONTEXTS) {
    window.__REACT_CONTEXTS[name] = context;
    console.log(\`[Diagnostics] Registered context: \${name}\`);
  }
  return context;
}

export function getDiagnosticInfo() {
  const info = {
    react: window.React ? window.React.version : 'Not loaded',
    reactDOM: window.ReactDOM ? window.ReactDOM.version : 'Not loaded',
    contexts: Object.keys(window.__REACT_CONTEXTS || {}),
    hooks: Object.keys(window.__REACT_HOOKS || {}),
    errors: window.__REACT_DIAGNOSTIC ? window.__REACT_DIAGNOSTIC.errors : []
  };

  console.log('[Diagnostics] Info:', info);
  return info;
}

export default {
  registerContext,
  getDiagnosticInfo
};`
};

// Write files to utils directory
Object.entries(files).forEach(([filename, content]) => {
    const filePath = path.join(utilsDir, filename);
    fs.writeFileSync(filePath, content.trim());
    console.log(`Created ${filename}`);

    // Copy to react-fixes directory
    const fixesPath = path.join(reactFixesDir, filename);
    fs.copyFileSync(filePath, fixesPath);
    console.log(`Copied ${filename} to react-fixes`);
});
