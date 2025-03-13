#!/bin/bash
set -e

echo "===== FIXING GUNICORN APP CONFIGURATION ====="

# Create a new start.sh file that uses the correct application
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING FLASK APPLICATION FOR RENDER.COM ====="
echo "Date: $(date)"

# Set up environment
export FLASK_ENV=production
# Get PORT from environment variable with fallback
PORT=${PORT:-5000}
echo "Starting server on port $PORT..."

# Export PYTHONPATH to include current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Based on the app.py content, we need to use app.application as the WSGI app
echo "Using app.application as the WSGI entry point"
exec gunicorn "app:application" \
  --bind "0.0.0.0:$PORT" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --workers 2 \
  --timeout 60
EOF

chmod +x start.sh
echo "✅ Updated start.sh to use app:application instead of app:app"

# Create a simple test for the app
cat > test-app.py << 'EOF'
#!/usr/bin/env python3
from app import create_app

print("Testing application imports...")
app = create_app()
print(f"✅ Application loaded successfully")
print(f"Application routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
EOF

chmod +x test-app.py
echo "✅ Created test-app.py to verify application loading"

echo "===== FIX COMPLETE ====="
echo "Try running: PORT=8000 ./start.sh"
echo "Or test the app imports with: python3 test-app.py"
