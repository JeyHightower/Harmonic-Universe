#!/bin/bash

# Navigate to frontend source directory
cd .. && cd frontend/src

# Create simplified App.jsx
cat > App.jsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

# Create reportWebVitals.js if missing
cat > reportWebVitals.js << 'EOF'
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      console.log('Web Vitals library not available');
    });
  }
};

export default reportWebVitals;
EOF

# Check if index.js exists and update it if needed
if [ -f "index.js" ]; then
  # Backup the original file
  cp index.js index.js.backup

  # Create updated index.js with proper imports
  cat > index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Comment this out if web-vitals is not in your dependencies
// reportWebVitals();
EOF
fi

# Create index.css if it doesn't exist
if [ ! -f "index.css" ]; then
  cat > index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF
fi

# Create App.css if it doesn't exist
if [ ! -f "App.css" ]; then
  cat > App.css << 'EOF'
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
EOF
fi

echo "Fixed App.jsx and created reportWebVitals.js"

# Return to the previous directory
cd ../..

# Remind about installing web-vitals
echo "Don't forget to install web-vitals dependency:"
echo "cd frontend && npm install web-vitals --save --legacy-peer-deps"
