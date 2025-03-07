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

# Create necessary directories
mkdir -p static

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
        echo "Frontend build directory found, linking to static files..."
        cp -R frontend/build/* static/
    elif [ -d "frontend/public" ]; then
        echo "Frontend public directory found, linking to static files..."
        cp -R frontend/public/* static/
    else
        echo "No frontend build or public directory found. Creating a minimal index.html"
        # Create a minimal index.html
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
    fi
else
    echo "No frontend directory found. Creating a minimal index.html"
    # Create a minimal index.html
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
fi

# List static directory contents for verification
echo "Static directory contents:"
ls -la static/

# Log the absolute path for debugging
echo "Absolute path to static directory: $(pwd)/static"
echo "This should match /opt/render/project/src/static on Render"

# Set environment variables
export FLASK_NO_MIGRATE=true
export SKIP_DB_UPGRADE=true
export DISABLE_MIGRATIONS=true

echo "Build completed successfully"
