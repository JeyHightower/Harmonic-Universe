#!/bin/bash

# Exit on error
set -e

# Print commands
set -x

# Environment setup
export NODE_ENV=production
export FLASK_ENV=production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function for section headers
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Helper function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Frontend build
print_header "Building Frontend"

cd frontend

# Install dependencies
npm ci
check_status "Frontend dependency installation"

# Generate PWA assets
npm run generate-pwa-assets
check_status "PWA asset generation"

# Build frontend
npm run build
check_status "Frontend build"

# Copy service worker to build directory
cp src/service-worker.js dist/
check_status "Service worker copy"

# Generate PWA manifest
cp public/manifest.json dist/
check_status "PWA manifest copy"

# Optimize assets
npm run optimize-assets
check_status "Asset optimization"

cd ..

# Backend setup
print_header "Setting up Backend"

cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate
check_status "Virtual environment setup"

# Install dependencies
pip install -r requirements.txt
check_status "Backend dependency installation"

# Run database migrations
flask db upgrade
check_status "Database migrations"

# Generate static files
flask generate-static
check_status "Static file generation"

cd ..

# Copy frontend build to backend static
print_header "Integrating Frontend with Backend"

rm -rf backend/static/*
cp -r frontend/dist/* backend/static/
check_status "Frontend integration"

# Configure caching headers
print_header "Configuring Caching"

# Create cache configuration
cat > backend/static/.htaccess << EOL
<IfModule mod_headers.c>
    # Cache PWA assets for 1 year
    <FilesMatch "\.(ico|png|svg|json)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # Cache service worker for 0 seconds (no cache)
    <FilesMatch "service-worker.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires 0
    </FilesMatch>

    # Cache static assets for 1 week
    <FilesMatch "\.(css|js)$">
        Header set Cache-Control "public, max-age=604800, immutable"
    </FilesMatch>

    # Cache HTML for 0 seconds (no cache)
    <FilesMatch "\.html$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires 0
    </FilesMatch>
</IfModule>
EOL
check_status "Cache configuration"

# Setup monitoring
print_header "Setting up Monitoring"

# Create monitoring directory
mkdir -p /var/log/harmonic
touch /var/log/harmonic/monitoring.log
chmod 644 /var/log/harmonic/monitoring.log
check_status "Monitoring setup"

# Configure log rotation
cat > /etc/logrotate.d/harmonic-monitoring << EOL
/var/log/harmonic/monitoring.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOL
check_status "Log rotation configuration"

# Final checks
print_header "Running Final Checks"

# Verify service worker
if [ -f "backend/static/service-worker.js" ]; then
    echo -e "${GREEN}✓ Service worker present${NC}"
else
    echo -e "${RED}✗ Service worker missing${NC}"
    exit 1
fi

# Verify manifest
if [ -f "backend/static/manifest.json" ]; then
    echo -e "${GREEN}✓ PWA manifest present${NC}"
else
    echo -e "${RED}✗ PWA manifest missing${NC}"
    exit 1
fi

# Verify icons
if [ -d "backend/static/icons" ]; then
    echo -e "${GREEN}✓ PWA icons present${NC}"
else
    echo -e "${RED}✗ PWA icons missing${NC}"
    exit 1
fi

print_header "Deployment Complete"
echo -e "${GREEN}Application successfully deployed with PWA support${NC}"
