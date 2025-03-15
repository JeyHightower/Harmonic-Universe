#!/bin/bash

# Exit on error
set -e

# Check for environment argument
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <environment>"
    echo "Environments: staging, production"
    exit 1
fi

ENVIRONMENT=$1

echo "Starting Harmonic Universe deployment to $ENVIRONMENT..."

# Load environment variables
if [ -f "config/shared/.env.shared" ]; then
    source config/shared/.env.shared
fi

if [ -f "config/$ENVIRONMENT/.env" ]; then
    source "config/$ENVIRONMENT/.env"
fi

# Run build process
echo "Running build process..."
./scripts/build/build.sh

# Deploy based on environment
case $ENVIRONMENT in
    "staging")
        echo "Deploying to staging environment..."
        # Add staging deployment commands here
        ;;
    "production")
        echo "Deploying to production environment..."
        # Add production deployment commands here
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Run database migrations
echo "Running database migrations..."
cd backend
source venv/bin/activate
flask db upgrade

# Start services
echo "Starting services..."
# Add service start commands here

echo "Deployment to $ENVIRONMENT completed successfully!"
