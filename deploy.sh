#!/bin/bash
set -e

echo "=== Starting Zero-Downtime Deployment ==="
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEPLOY_DIR="deploy_$TIMESTAMP"
CURRENT_LINK="current"
BACKUP_LINK="previous"

# Check if we're already in a deployment directory
if [[ "$PWD" =~ deploy_ ]]; then
    echo "ERROR: Already in a deployment directory. Aborting."
    exit 1
fi

# Create new deployment directory
echo "Creating new deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Clone the codebase
echo "Cloning repository..."
git clone https://github.com/YOUR_USERNAME/Harmonic-Universe.git "$DEPLOY_DIR"

# Change to the deployment directory
cd "$DEPLOY_DIR"

# Build the application
echo "Building application..."
./build.sh

# Run tests
echo "Running tests..."
python run_tests.py || {
    echo "Tests failed! Aborting deployment."
    cd ..
    rm -rf "$DEPLOY_DIR"
    exit 1
}

# Backup current deployment
cd ..
if [ -L "$CURRENT_LINK" ]; then
    echo "Backing up current deployment..."
    rm -f "$BACKUP_LINK"
    mv "$CURRENT_LINK" "$BACKUP_LINK"
fi

# Update symlink to new deployment
echo "Updating symlink to new deployment..."
ln -sf "$DEPLOY_DIR" "$CURRENT_LINK"

# Restart the application
echo "Restarting application..."
if command -v supervisorctl &> /dev/null; then
    supervisorctl restart harmonic-universe
else
    # Alternative restart method
    cd "$CURRENT_LINK"
    kill $(cat app.pid) 2>/dev/null || true
    nohup gunicorn wsgi:app --workers 4 --bind 0.0.0.0:10000 --pid app.pid > app.log 2>&1 &
fi

# Verify deployment
echo "Verifying deployment..."
sleep 5
if curl -s http://localhost:10000/api/health | grep -q '"status":"ok"'; then
    echo "Deployment successful!"
else
    echo "Deployment failed! Rolling back..."
    rm -f "$CURRENT_LINK"
    ln -sf $(readlink "$BACKUP_LINK") "$CURRENT_LINK"

    # Restart with previous version
    cd "$CURRENT_LINK"
    if command -v supervisorctl &> /dev/null; then
        supervisorctl restart harmonic-universe
    else
        kill $(cat app.pid) 2>/dev/null || true
        nohup gunicorn wsgi:app --workers 4 --bind 0.0.0.0:10000 --pid app.pid > app.log 2>&1 &
    fi

    echo "Rollback complete."
    exit 1
fi

# Clean up old deployments
echo "Cleaning up old deployments..."
ls -d deploy_* | sort -r | tail -n +4 | xargs rm -rf

echo "=== Deployment Complete ==="
