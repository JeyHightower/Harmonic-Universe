// Simple Express server for serving the static files on Render.com
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`[Server] Starting Express server on port ${PORT}`);
console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[Server] RENDER environment variable: ${process.env.RENDER || 'not set'}`);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Apply React context fix at runtime for any dynamic loading
app.use((req, res, next) => {
  // Only intercept JavaScript files
  if (req.path.endsWith('.js') && req.path.includes('ant-icons')) {
    const filePath = path.join(__dirname, 'dist', req.path);

    if (fs.existsSync(filePath)) {
      let fileContent = fs.readFileSync(filePath, 'utf8');

      // Only modify if not already patched
      if (!fileContent.includes('// Direct patch for React.createContext')) {
        console.log(`[Runtime Patch] Patching ${req.path}`);

        // Apply the patch
        const patchedContent = `
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

// Ensure IconContext is defined
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

var IconContext = ensureIconContext();

${fileContent}`;

        // Serve the patched content
        res.set('Content-Type', 'application/javascript');
        return res.send(patchedContent);
      }
    }
  }

  next();
});

// For any other requests, send the index.html file
// This enables client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Express server running at http://0.0.0.0:${PORT}`);
  console.log(`[Server] Serving static files from: ${path.join(__dirname, 'dist')}`);
});
