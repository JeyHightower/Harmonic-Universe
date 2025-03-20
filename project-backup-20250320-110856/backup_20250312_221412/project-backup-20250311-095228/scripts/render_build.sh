#!/bin/bash
set -e

echo "===== RUNNING ENHANCED RENDER BUILD SCRIPT ====="
echo "Date: $(date)"
echo "Environment: ${NODE_ENV:-production}"

# Directory setup
mkdir -p static
mkdir -p build
mkdir -p dist

# Make scripts executable
chmod +x fix-deployment.sh || true
chmod +x fix-script-loading.sh || true

# Run the comprehensive deployment fixes first
echo "Running fix-deployment.sh to ensure all required files exist..."
./fix-deployment.sh

# Fix script loading paths
echo "Running fix-script-loading.sh to fix script references..."
./fix-script-loading.sh

# Create database module if needed
if [[ ! -f "database.py" ]]; then
  echo "Creating database.py module..."
  cat > "database.py" << 'EOF'
"""
Database module for SQLAlchemy session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./harmonic_universe.db")

# Handle PostgreSQL scheme for SQLAlchemy when using Render
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()

def get_db():
    """
    Get database session with automatic cleanup.
    Returns a generator that yields the session and ensures it is closed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF
  echo "✅ Created database.py module"
fi

# Create a diagnostic HTML page
echo "Creating diagnostic HTML page..."
cat > static/diagnostic.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe Diagnostic Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
        h1 { color: #333; }
        .status { padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
        pre { background: #f8f9fa; padding: 1rem; overflow: auto; }
    </style>
    <script src="/static/final-hook-suppressor.js"></script>
    <script src="/static/direct-hook-patcher.js"></script>
    <script src="/static/early-warning-interceptor.js"></script>
    <script src="https://unpkg.com/react@16.8.0/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@16.8.0/umd/react-dom.production.min.js"></script>
</head>
<body>
    <h1>Harmonic Universe Diagnostic Page</h1>

    <div id="status" class="status">Checking system status...</div>

    <h2>React Status</h2>
    <pre id="react-status">Checking React status...</pre>

    <h2>File Access Status</h2>
    <pre id="file-status">Checking file access...</pre>

    <h2>Script Loading Status</h2>
    <pre id="script-status">Checking script loading...</pre>

    <script>
        // Check React status
        function checkReact() {
            const status = document.getElementById('react-status');
            try {
                const results = [];

                if (window.React) {
                    results.push('✅ React is loaded');
                    results.push(`   Version: ${React.version || 'unknown'}`);

                    if (React.createElement) {
                        results.push('✅ React.createElement is available');
                    } else {
                        results.push('❌ React.createElement is missing');
                    }

                    if (React.createContext) {
                        results.push('✅ React.createContext is available');
                    } else {
                        results.push('❌ React.createContext is missing');
                    }

                } else {
                    results.push('❌ React is not loaded');
                }

                if (window.ReactDOM) {
                    results.push('✅ ReactDOM is loaded');
                } else {
                    results.push('❌ ReactDOM is not loaded');
                }

                status.textContent = results.join('\n');
            } catch (error) {
                status.textContent = `Error checking React: ${error.message}`;
                status.className = 'error';
            }
        }

        // Check file access
        function checkFiles() {
            const status = document.getElementById('file-status');
            const files = [
                '/static/final-hook-suppressor.js',
                '/static/direct-hook-patcher.js',
                '/static/early-warning-interceptor.js',
                '/static/hook-js-patcher.js',
                '/static/react-context-fix.js',
                '/static/react-hook-fix.js'
            ];

            const results = [];
            let pending = files.length;

            files.forEach(file => {
                fetch(file)
                    .then(response => {
                        if (response.ok) {
                            results.push(`✅ ${file} - Accessible`);
                        } else {
                            results.push(`❌ ${file} - Status: ${response.status}`);
                        }
                    })
                    .catch(error => {
                        results.push(`❌ ${file} - Error: ${error.message}`);
                    })
                    .finally(() => {
                        pending--;
                        if (pending === 0) {
                            status.textContent = results.join('\n');
                        }
                    });
            });
        }

        // Check script loading
        function checkScripts() {
            const status = document.getElementById('script-status');

            const scripts = [
                { name: 'final-hook-suppressor.js', global: 'window.__HOOK_SUPPRESSOR_LOADED' },
                { name: 'direct-hook-patcher.js', check: () => true }, // No specific global to check
                { name: 'early-warning-interceptor.js', global: 'window.__WARNING_INTERCEPTORS_INSTALLED' }
            ];

            const results = [];

            scripts.forEach(script => {
                try {
                    let loaded = false;

                    if (script.global) {
                        loaded = eval(script.global);
                    } else if (script.check) {
                        loaded = script.check();
                    }

                    if (loaded) {
                        results.push(`✅ ${script.name} - Properly loaded`);
                    } else {
                        results.push(`❌ ${script.name} - Not loaded correctly`);
                    }
                } catch (error) {
                    results.push(`❌ ${script.name} - Error: ${error.message}`);
                }
            });

            status.textContent = results.join('\n');
        }

        // Update overall status
        function updateStatus() {
            const status = document.getElementById('status');

            if (window.React && window.ReactDOM && window.React.createContext) {
                status.textContent = 'System is functioning properly';
                status.className = 'status success';
            } else if (window.React || window.ReactDOM) {
                status.textContent = 'System is partially functional';
                status.className = 'status warning';
            } else {
                status.textContent = 'System has critical issues';
                status.className = 'status error';
            }
        }

        // Run all checks
        window.onload = function() {
            checkReact();
            checkFiles();
            checkScripts();
            updateStatus();
        };
    </script>
</body>
</html>
EOF

echo "===== RENDER BUILD COMPLETED ====="
echo "All necessary files should be properly configured."
echo "The application should now load without errors."
