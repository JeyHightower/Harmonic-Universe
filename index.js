// Simple entry point index.js

// Check environment
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isNode) {
  // Node.js environment - Backend
  console.log('Running in Node.js environment');
  try {
    // Try to import and use the backend app
    const { app } = require('./backend/app') || require('./app') || require('./wsgi');

    // Export the app for potential use with Express or other frameworks
    module.exports = { app };

    // Start the app if this is the main file
    if (require.main === module) {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to load backend application:', error);
  }
} else {
  // Browser environment - Frontend
  console.log('Running in browser environment');

  // Redirect to the proper frontend path if needed
  if (window.location.pathname === '/index.js') {
    window.location.href = '/';
  }

  // Initialize any frontend functionality
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend initialized');
  });
} 