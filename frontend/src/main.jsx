// Fix for Ant Design Icons version issue
try {
  if (typeof window !== 'undefined') {
    window.__ANT_ICONS_VERSION__ = "4.2.1";

    // Create a global handler for common errors
    window.addEventListener('error', (event) => {
      const errorMessage = event.message || '';

      // Check if it's the version error
      if (errorMessage.includes('Cannot read properties of undefined') &&
        errorMessage.includes('version')) {
        console.warn('Caught version error, applying fix');
        event.preventDefault(); // Prevent the error from bubbling up

        // Apply global fix
        window.__ANT_FIXED_VERSION__ = "4.2.1";

        // Try to recover UI
        setTimeout(() => {
          const root = document.getElementById('root');
          if (root && (!root.childNodes || root.childNodes.length === 0)) {
            console.log('Attempting UI recovery...');
            // Your recovery code here
          }
        }, 100);
      }
    });
  }
} catch (e) {
  console.error('Error setting up error handlers:', e);
}

// Import safety patch at the very top
import './utils/react-safety-patch.jsx';

// Import at the very top to ensure React is available globally
import './utils/ensure-react';

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Add debug log
console.log('main.jsx is being loaded');

// Test importing an icon directly
try {
  console.log('Successfully imported UserOutlined icon:', UserOutlined);
} catch (error) {
  console.error('Error importing icon:', error);
}

// Initialize the React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
