#!/bin/bash

# Deploy script for storyboard functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting storyboard deployment...${NC}"

# Check if environment variables are set
if [ -z "$DEPLOY_ENV" ]; then
    echo -e "${RED}Error: DEPLOY_ENV not set. Please set to 'production' or 'staging'${NC}"
    exit 1
fi

# Set environment-specific variables
if [ "$DEPLOY_ENV" = "production" ]; then
    API_URL="https://api.harmonic-universe.com"
    FRONTEND_URL="https://harmonic-universe.com"
else
    API_URL="https://staging-api.harmonic-universe.com"
    FRONTEND_URL="https://staging.harmonic-universe.com"
fi

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed${NC}"
    exit 1
fi
cd ..

# Run database migrations
echo "Running database migrations..."
cd backend
flask db upgrade
if [ $? -ne 0 ]; then
    echo -e "${RED}Database migration failed${NC}"
    exit 1
fi
cd ..

# Deploy backend
echo "Deploying backend..."
cd backend
# Add your deployment commands here (e.g., AWS, Heroku, etc.)
# Example for Heroku:
# git push heroku master
cd ..

# Deploy frontend
echo "Deploying frontend..."
cd frontend
# Add your deployment commands here
# Example for AWS S3:
# aws s3 sync build/ s3://your-bucket-name
cd ..

# Run smoke tests
echo "Running smoke tests..."
cd backend
pytest tests/smoke/test_storyboard_smoke.py
if [ $? -ne 0 ]; then
    echo -e "${RED}Smoke tests failed${NC}"
    echo -e "${YELLOW}Please check the logs and consider rolling back${NC}"
    exit 1
fi
cd ..

# Update CDN cache (if applicable)
echo "Updating CDN cache..."
# Add CDN cache invalidation commands here
# Example for AWS CloudFront:
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo -e "${GREEN}Storyboard deployment complete!${NC}"
echo -e "${YELLOW}Please verify the deployment in the $DEPLOY_ENV environment${NC}"

# Add deployment completion notification (optional)
# Example: Send Slack notification
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"Storyboard deployment to '"$DEPLOY_ENV"' completed successfully"}' \
#     $SLACK_WEBHOOK_URL
