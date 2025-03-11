#!/bin/bash
set -e

echo "Fixing import extension issues in React project..."
cd frontend/src

# 1. Create ProtectedRoute component if missing
echo "Creating ProtectedRoute component..."
mkdir -p components
if [ ! -f components/ProtectedRoute.jsx ]; then
  cat > components/ProtectedRoute.jsx << 'EOF'
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
EOF
  echo "✅ Created ProtectedRoute component"
fi

# 2. Update index.js to include file extensions
echo "Updating index.js with proper extensions..."
if [ -f index.js ]; then
  # Backup original file
  cp index.js index.js.backup

  # Update imports to include file extensions
  sed -i "s|import App from './App';|import App from './App.jsx';|" index.js
  sed -i "s|import reportWebVitals from './reportWebVitals';|import reportWebVitals from './reportWebVitals.js';|" index.js
  sed -i "s|reportWebVitals = require('./reportWebVitals')|reportWebVitals = require('./reportWebVitals.js')|" index.js

  echo "✅ Updated index.js with proper file extensions"
fi

# 3. Fix routes.js import paths
echo "Fixing routes.js import paths..."
if [ -f routes.js ]; then
  # Backup original file
  cp routes.js routes.js.backup

  # Update imports to include file extensions
  sed -i 's|import Settings from .*|import Settings from "./components/Settings.jsx";|' routes.js
  sed -i 's|import ProtectedRoute from .*|import ProtectedRoute from "./components/ProtectedRoute.jsx";|' routes.js
  sed -i 's|import LandingPage from|import LandingPage from|' routes.js  # Keep this line for future extension additions
  sed -i 's|import Dashboard from|import Dashboard from|' routes.js  # Keep this line for future extension additions

  echo "✅ Updated routes.js with proper import paths and extensions"
fi

# 4. Fix App.jsx imports
echo "Fixing App.jsx imports..."
if [ -f App.jsx ]; then
  # Backup original file
  cp App.jsx App.jsx.backup

  # Update layout import to include file extension
  sed -i 's|import Layout from "./components/layout/Layout";|import Layout from "./components/layout/Layout.jsx";|' App.jsx

  echo "✅ Updated App.jsx with proper import paths"
fi

# 5. Find other JS/JSX files and fix their imports
echo "Scanning for other files with import statements to fix..."
for file in $(find . -name "*.js" -o -name "*.jsx" | grep -v "node_modules"); do
  # Skip files we've already processed
  if [[ "$file" == "./index.js" || "$file" == "./routes.js" || "$file" == "./App.jsx" ]]; then
    continue
  fi

  # Check if file has import statements without extensions
  if grep -q "import.*from '\.\/.*';" "$file" || grep -q 'import.*from "\./.*";' "$file"; then
    echo "Checking imports in $file..."

    # Make backup
    cp "$file" "${file}.backup"

    # For each import from a relative path, add extensions if missing
    # This is a simplified approach and may need manual review after running
    sed -i 's|import \(.*\) from "\./\([^"]*\)"|import \1 from "./\2.jsx"|g' "$file"
    sed -i "s|import \(.*\) from '\./\([^']*\)'|import \1 from './\2.jsx'|g" "$file"

    echo "  Updated imports in $file"
  fi
done

# 6. Create fallback versions of commonly imported components
echo "Creating fallback versions of commonly imported components..."

# Home component
mkdir -p components/features/home
if [ ! -f components/features/home/Home.jsx ]; then
  cat > components/features/home/Home.jsx << 'EOF'
import React from 'react';

const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <p>This is a fallback Home component for build compatibility.</p>
    </div>
  );
};

export default Home;
EOF
  echo "✅ Created fallback Home component"
fi

echo "Extensions fix completed successfully!"
echo "Note: You may need to manually review some import paths as this script uses simple patterns."
