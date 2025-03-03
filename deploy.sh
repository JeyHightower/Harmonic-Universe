#!/bin/bash

# Harmonic Universe - Deployment Script
# This script handles all deployment-related operations

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Function to print success/error messages
print_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    if [ ! -z "$2" ]; then
      echo -e "${YELLOW}$2${NC}"
    fi
    exit 1
  fi
}

# Load environment variables
load_env() {
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
  fi
}

# Build frontend for production
build_frontend() {
  print_section "Building Frontend for Production"

  echo "Installing frontend dependencies..."
  cd frontend
  npm install
  print_result "Frontend dependencies installation" "Failed to install frontend dependencies."

  echo "Building frontend..."
  npm run build
  print_result "Frontend build" "Failed to build frontend."
  cd ..

  echo -e "${GREEN}✓ Frontend built successfully${NC}"
}

# Build backend for production
build_backend() {
  print_section "Building Backend for Production"

  echo "Installing backend dependencies..."
  cd backend
  pip install -r requirements.txt
  print_result "Backend dependencies installation" "Failed to install backend dependencies."
  cd ..

  echo -e "${GREEN}✓ Backend prepared successfully${NC}"
}

# Build Docker containers
build_docker() {
  print_section "Building Docker Containers"

  echo "Building Docker containers..."
  docker-compose build
  print_result "Docker build" "Failed to build Docker containers."

  echo -e "${GREEN}✓ Docker containers built successfully${NC}"
}

# Deploy with Docker
deploy_docker() {
  print_section "Deploying with Docker"

  echo "Starting Docker containers..."
  docker-compose up -d
  print_result "Docker deployment" "Failed to start Docker containers."

  echo -e "${GREEN}✓ Docker deployment completed successfully${NC}"
  echo -e "${CYAN}Application is now running in Docker containers${NC}"
}

# Deploy to production server
deploy_production() {
  print_section "Deploying to Production Server"

  # Check if required environment variables are set
  if [ -z "$PRODUCTION_SERVER" ] || [ -z "$PRODUCTION_USER" ]; then
    echo -e "${RED}Error: PRODUCTION_SERVER and PRODUCTION_USER environment variables must be set${NC}"
    exit 1
  fi

  # Build frontend
  build_frontend

  # Create deployment package
  echo "Creating deployment package..."
  deployment_dir="deployment_$(date +"%Y%m%d_%H%M%S")"
  mkdir -p $deployment_dir

  # Copy backend files
  echo "Copying backend files..."
  cp -r backend $deployment_dir/
  rm -rf $deployment_dir/backend/__pycache__ $deployment_dir/backend/.pytest_cache

  # Copy frontend build
  echo "Copying frontend build..."
  mkdir -p $deployment_dir/frontend
  cp -r frontend/dist $deployment_dir/frontend/

  # Copy configuration files
  echo "Copying configuration files..."
  cp .env $deployment_dir/
  cp docker-compose.yml $deployment_dir/

  # Create deployment archive
  echo "Creating deployment archive..."
  tar -czf ${deployment_dir}.tar.gz $deployment_dir
  rm -rf $deployment_dir

  # Upload to production server
  echo "Uploading to production server..."
  scp ${deployment_dir}.tar.gz ${PRODUCTION_USER}@${PRODUCTION_SERVER}:~/
  print_result "Deployment upload" "Failed to upload deployment package."

  # Execute deployment commands on server
  echo "Executing deployment commands on server..."
  ssh ${PRODUCTION_USER}@${PRODUCTION_SERVER} << EOF
    mkdir -p ${deployment_dir}
    tar -xzf ${deployment_dir}.tar.gz
    cd ${deployment_dir}
    docker-compose down
    docker-compose up -d
    exit
EOF
  print_result "Remote deployment" "Failed to execute deployment commands on server."

  # Clean up local files
  rm ${deployment_dir}.tar.gz

  echo -e "${GREEN}✓ Production deployment completed successfully${NC}"
  echo -e "${CYAN}Application is now running on production server${NC}"
}

# Deploy to staging server
deploy_staging() {
  print_section "Deploying to Staging Server"

  # Check if required environment variables are set
  if [ -z "$STAGING_SERVER" ] || [ -z "$STAGING_USER" ]; then
    echo -e "${RED}Error: STAGING_SERVER and STAGING_USER environment variables must be set${NC}"
    exit 1
  fi

  # Build frontend
  build_frontend

  # Create deployment package
  echo "Creating deployment package..."
  deployment_dir="staging_$(date +"%Y%m%d_%H%M%S")"
  mkdir -p $deployment_dir

  # Copy backend files
  echo "Copying backend files..."
  cp -r backend $deployment_dir/
  rm -rf $deployment_dir/backend/__pycache__ $deployment_dir/backend/.pytest_cache

  # Copy frontend build
  echo "Copying frontend build..."
  mkdir -p $deployment_dir/frontend
  cp -r frontend/dist $deployment_dir/frontend/

  # Copy configuration files
  echo "Copying configuration files..."
  cp .env.staging $deployment_dir/.env
  cp docker-compose.yml $deployment_dir/

  # Create deployment archive
  echo "Creating deployment archive..."
  tar -czf ${deployment_dir}.tar.gz $deployment_dir
  rm -rf $deployment_dir

  # Upload to staging server
  echo "Uploading to staging server..."
  scp ${deployment_dir}.tar.gz ${STAGING_USER}@${STAGING_SERVER}:~/
  print_result "Deployment upload" "Failed to upload deployment package."

  # Execute deployment commands on server
  echo "Executing deployment commands on server..."
  ssh ${STAGING_USER}@${STAGING_SERVER} << EOF
    mkdir -p ${deployment_dir}
    tar -xzf ${deployment_dir}.tar.gz
    cd ${deployment_dir}
    docker-compose down
    docker-compose up -d
    exit
EOF
  print_result "Remote deployment" "Failed to execute deployment commands on server."

  # Clean up local files
  rm ${deployment_dir}.tar.gz

  echo -e "${GREEN}✓ Staging deployment completed successfully${NC}"
  echo -e "${CYAN}Application is now running on staging server${NC}"
}

# Print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Deployment Script${NC}"
  echo -e "Usage: $0 <command>"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  build-frontend    Build frontend for production"
  echo -e "  build-backend     Prepare backend for production"
  echo -e "  build-docker      Build Docker containers"
  echo -e "  build-all         Build frontend, backend, and Docker containers"
  echo -e "  docker            Deploy with Docker locally"
  echo -e "  production        Deploy to production server"
  echo -e "  staging           Deploy to staging server"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 build-all      Build all components for production"
  echo -e "  $0 docker         Deploy locally using Docker"
  echo -e "  $0 production     Deploy to production server"
}

# Main function
main() {
  # Load environment variables
  load_env

  if [ $# -eq 0 ]; then
    print_usage
    exit 1
  fi

  command=$1

  case $command in
    build-frontend)
      build_frontend
      ;;
    build-backend)
      build_backend
      ;;
    build-docker)
      build_docker
      ;;
    build-all)
      build_frontend
      build_backend
      build_docker
      ;;
    docker)
      deploy_docker
      ;;
    production)
      deploy_production
      ;;
    staging)
      deploy_staging
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
