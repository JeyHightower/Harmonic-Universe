#!/bin/bash
set -e

echo "===== FIXING GUNICORN APPLICATION IMPORT ERROR ====="

# First, analyze app.py to find the actual Flask app variable
if [ -f "app.py" ]; then
    echo "Analyzing app.py file..."

    # Look for the Flask app variable pattern
    if grep -q "app = " app.py; then
        APP_VAR="app"
        echo "Found Flask app variable: 'app'"
    elif grep -q "application = " app.py; then
        APP_VAR="application"
        echo "Found Flask app variable: 'application'"
    elif grep -q "create_app()" app.py || grep -q "create_app(" app.py; then
        echo "Found create_app() function - checking for usage pattern"
        if grep -q "app = create_app" app.py; then
            APP_VAR="app"
            echo "App created as: 'app = create_app()'"
        elif grep -q "application = create_app" app.py; then
            APP_VAR="application"
            echo "App created as: 'application = create_app()'"
        else
            echo "Create_app() found but usage pattern unclear"
            APP_VAR="app"  # Default assumption
        fi
    else
        echo "Could not determine Flask app variable name, assuming 'app'"
        APP_VAR="app"
    fi

    # Create application.py as a compatibility layer
    echo "Creating application.py compatibility layer..."
    cat > application.py << EOF
"""
Compatibility module for Gunicorn WSGI server.
This imports from app.py and ensures either 'app' or 'application' is available.
"""
try:
    # First try importing app
    from app import $APP_VAR

    # If the variable is already named 'application', we're done
    if "$APP_VAR" == "application":
        # application is already defined correctly
        pass
    else:
        # Otherwise, create an alias
        application = $APP_VAR

except ImportError as e:
    # If direct import fails, try importing the create_app function
    try:
        from app import create_app
        application = create_app()
    except ImportError:
        # If all else fails, write error to a file and raise
        with open("gunicorn_import_error.log", "w") as f:
            f.write(f"Failed to import Flask app: {str(e)}")
        raise
EOF
    echo "✅ Created application.py that imports from app.py"

    # Update start.sh to use application.py
    echo "Updating start.sh to use application:application..."
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

# Using our compatibility layer
echo "Using application:application as the WSGI entry point"
exec gunicorn "application:application" \
  --bind "0.0.0.0:$PORT" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --workers 2 \
  --timeout 60
EOF
    chmod +x start.sh
    echo "✅ Updated start.sh to use application:application"
else
    echo "❌ app.py not found! Cannot fix Gunicorn import error."
    exit 1
fi

echo
echo "===== GUNICORN IMPORT ERROR FIXED ====="
echo "The script has created an application.py compatibility layer"
echo "and updated start.sh to use 'application:application'."
echo
echo "This approach should work regardless of how your Flask app is defined in app.py."
echo "Try running the application with: ./start.sh"
