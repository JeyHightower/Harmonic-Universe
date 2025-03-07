#!/bin/bash
set -e  # Exit on error

echo "Starting Render build process..."

# Create flag file to skip migrations
echo "Creating migration skip flag..."
touch .SKIP_MIGRATIONS

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Fix database migration state directly to be absolutely sure
echo "Checking and fixing database state..."
python -c "
import os, psycopg2, sys
try:
    print('Checking database state...')
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()

    # Check if users table exists
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users')\")
    users_exists = cur.fetchone()[0]

    # Check if alembic_version exists
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='alembic_version')\")
    alembic_exists = cur.fetchone()[0]

    if users_exists and not alembic_exists:
        print('Creating alembic_version table')
        cur.execute('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) PRIMARY KEY)')
        cur.execute(\"INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282')\")
        conn.commit()
        print('Database migration state fixed')
    else:
        print(f'Database check: users table exists: {users_exists}, alembic table exists: {alembic_exists}')

    conn.close()
except Exception as e:
    print(f'Error checking database: {e}')
    # Continue anyway
"

# Debugging: Print current directory and environment
echo "Current directory: $(pwd)"
echo "Environment: RENDER=${RENDER}"

# Static file handling - creating directories with explicit permissions
echo "Ensuring static directories exist with correct permissions..."
mkdir -p static
chmod 755 static

# Make sure the Render absolute path also exists
if [ "$RENDER" = "true" ]; then
    echo "Creating Render-specific static directories..."
    mkdir -p /opt/render/project/src/static
    chmod 755 /opt/render/project/src/static
fi

# Check if we have a frontend to build
if [ -d "frontend" ]; then
    echo "Building frontend..."

    # Install frontend dependencies
    cd frontend
    npm install

    # Build frontend
    npm run build

    # Create a symbolic link to the build directory
    cd ..

    # If build directory exists, copy or link files to where Flask expects them
    if [ -d "frontend/build" ]; then
        echo "Frontend build directory found, copying to static files..."
        cp -R frontend/build/* static/

        # Also copy to Render-specific location if on Render
        if [ "$RENDER" = "true" ]; then
            echo "Copying to Render-specific static path..."
            cp -R frontend/build/* /opt/render/project/src/static/
        fi
    elif [ -d "frontend/public" ]; then
        echo "Frontend public directory found, copying to static files..."
        cp -R frontend/public/* static/

        # Also copy to Render-specific location if on Render
        if [ "$RENDER" = "true" ]; then
            echo "Copying to Render-specific static path..."
            cp -R frontend/public/* /opt/render/project/src/static/
        fi
    elif [ -d "frontend/dist" ]; then
        echo "Frontend dist directory found, copying to static files..."
        cp -R frontend/dist/* static/

        # Also copy to Render-specific location if on Render
        if [ "$RENDER" = "true" ]; then
            echo "Copying to Render-specific static path..."
            cp -R frontend/dist/* /opt/render/project/src/static/
        fi
    else
        echo "No frontend build directory found. Creating a minimal index.html"
        # Create a minimal index.html with proper permissions
        cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>Frontend files not found. Please check your deployment configuration.</p>
</body>
</html>
EOF
        chmod 644 static/index.html

        # Also copy to Render-specific location if on Render
        if [ "$RENDER" = "true" ]; then
            echo "Creating minimal index.html in Render-specific static path..."
            cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>Frontend files not found. Please check your deployment configuration.</p>
</body>
</html>
EOF
            chmod 644 /opt/render/project/src/static/index.html
        fi
    fi
else
    echo "No frontend directory found. Creating a minimal index.html"
    # Create a minimal index.html with proper permissions
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>Frontend files not found. Please check your deployment configuration.</p>
</body>
</html>
EOF
    chmod 644 static/index.html

    # Also copy to Render-specific location if on Render
    if [ "$RENDER" = "true" ]; then
        echo "Creating minimal index.html in Render-specific static path..."
        cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>Frontend files not found. Please check your deployment configuration.</p>
</body>
</html>
EOF
        chmod 644 /opt/render/project/src/static/index.html
    fi
fi

# Run the diagnostic script to verify and fix any issues
echo "Running diagnostic script..."
python render_diagnose.py

# Run the static symlink script to ensure static files are accessible from all locations
echo "Running static symlink script..."
python app_static_symlink.py

# List static directory contents for verification
echo "Static directory contents:"
ls -la static/

# If on Render, also check the Render-specific path
if [ "$RENDER" = "true" ]; then
    echo "Render-specific static directory contents:"
    ls -la /opt/render/project/src/static/
fi

# Log the absolute path for debugging
echo "Absolute path to static directory: $(pwd)/static"
echo "This should match /opt/render/project/src/static on Render"

# Set environment variables
export FLASK_NO_MIGRATE=true
export SKIP_DB_UPGRADE=true
export DISABLE_MIGRATIONS=true

echo "Build completed successfully"
