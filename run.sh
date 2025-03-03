#!/bin/bash

# Harmonic Universe - Main Control Script
# This script provides a centralized way to manage all aspects of the Harmonic Universe project

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

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check environment variables
check_env_vars() {
  print_section "Checking Environment Variables"

  if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example${NC}"
    if [ -f .env.example ]; then
      cp .env.example .env
      echo -e "${GREEN}Created .env file from .env.example${NC}"
      echo -e "${YELLOW}Please update the .env file with your configuration${NC}"
    else
      echo -e "${RED}Error: .env.example file not found${NC}"
      exit 1
    fi
  fi

  # Source the .env file
  set -a
  source .env
  set +a

  # Check required environment variables
  required_vars=("DATABASE_URL" "SECRET_KEY" "FRONTEND_URL")
  missing_vars=0

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "${RED}Missing required environment variable: ${var}${NC}"
      missing_vars=$((missing_vars+1))
    fi
  done

  if [ $missing_vars -gt 0 ]; then
    echo -e "${RED}Please set all required environment variables in .env file${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Environment variables checked successfully${NC}"
}

# Function to setup the database
setup_database() {
  print_section "Setting Up Database"

  # Check if PostgreSQL is running
  if command_exists pg_isready; then
    pg_isready
    if [ $? -ne 0 ]; then
      echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL service.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}pg_isready command not found. Skipping PostgreSQL check.${NC}"
  fi

  # Create database if it doesn't exist
  if [ -z "$1" ] || [ "$1" != "--skip-db-creation" ]; then
    echo "Creating database if it doesn't exist..."
    python backend/scripts/create_db.py
    print_result "Database creation" "Failed to create database. Check your PostgreSQL configuration."
  fi

  # Run migrations
  echo "Running database migrations..."
  cd backend && python -m alembic upgrade head
  print_result "Database migrations" "Failed to run migrations."
  cd ..

  # Seed database if needed
  if [ "$1" = "--with-seed" ]; then
    echo "Seeding database with initial data..."
    python backend/app/seeds/seed.py
    print_result "Database seeding" "Failed to seed database."
  fi

  echo -e "${GREEN}✓ Database setup completed successfully${NC}"
}

# Function to install dependencies
install_dependencies() {
  print_section "Installing Dependencies"

  # Backend dependencies
  echo "Installing backend dependencies..."
  cd backend
  pip install -r requirements.txt
  print_result "Backend dependencies installation" "Failed to install backend dependencies."
  cd ..

  # Frontend dependencies
  echo "Installing frontend dependencies..."
  cd frontend
  npm install
  print_result "Frontend dependencies installation" "Failed to install frontend dependencies."
  cd ..

  echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

# Function to run tests
run_tests() {
  print_section "Running Tests"

  test_type=$1

  case $test_type in
    backend)
      echo "Running backend tests..."
      cd backend
      python -m pytest
      print_result "Backend tests" "Some backend tests failed."
      cd ..
      ;;
    frontend)
      echo "Running frontend tests..."
      cd frontend
      npm test
      print_result "Frontend tests" "Some frontend tests failed."
      cd ..
      ;;
    e2e)
      echo "Running end-to-end tests..."
      cd backend
      python -m pytest tests/e2e
      print_result "End-to-end tests" "Some end-to-end tests failed."
      cd ..
      ;;
    all)
      echo "Running all tests..."
      cd backend
      python -m pytest
      print_result "Backend tests" "Some backend tests failed."
      cd ..

      cd frontend
      npm test
      print_result "Frontend tests" "Some frontend tests failed."
      cd ..
      ;;
    *)
      echo -e "${RED}Invalid test type: $test_type${NC}"
      echo "Available test types: backend, frontend, e2e, all"
      exit 1
      ;;
  esac

  echo -e "${GREEN}✓ Tests completed successfully${NC}"
}

# Function to start development servers
start_dev() {
  print_section "Starting Development Servers"

  # Check if ports are available
  backend_port=${BACKEND_PORT:-8000}
  frontend_port=${FRONTEND_PORT:-3000}

  if command_exists lsof; then
    if lsof -Pi :$backend_port -sTCP:LISTEN -t >/dev/null ; then
      echo -e "${RED}Port $backend_port is already in use. Please free this port or set a different BACKEND_PORT in .env${NC}"
      exit 1
    fi

    if lsof -Pi :$frontend_port -sTCP:LISTEN -t >/dev/null ; then
      echo -e "${RED}Port $frontend_port is already in use. Please free this port or set a different FRONTEND_PORT in .env${NC}"
      exit 1
    fi
  fi

  # Start backend server
  echo "Starting backend server..."
  cd backend
  export FLASK_APP=run.py
  export FLASK_ENV=development
  python run.py &
  backend_pid=$!
  cd ..

  # Start frontend server
  echo "Starting frontend server..."
  cd frontend
  npm start &
  frontend_pid=$!
  cd ..

  echo -e "${GREEN}✓ Development servers started${NC}"
  echo -e "${CYAN}Backend running on http://localhost:$backend_port${NC}"
  echo -e "${CYAN}Frontend running on http://localhost:$frontend_port${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

  # Handle graceful shutdown
  trap "kill $backend_pid $frontend_pid; echo -e '\n${GREEN}Servers stopped${NC}'; exit 0" INT TERM
  wait
}

# Function to build for production
build_prod() {
  print_section "Building for Production"

  # Build frontend
  echo "Building frontend..."
  cd frontend
  npm run build
  print_result "Frontend build" "Failed to build frontend."
  cd ..

  # Prepare backend
  echo "Preparing backend..."
  cd backend
  pip install -r requirements.txt
  print_result "Backend preparation" "Failed to prepare backend."
  cd ..

  echo -e "${GREEN}✓ Production build completed successfully${NC}"
  echo -e "${CYAN}Frontend build is in frontend/dist${NC}"
  echo -e "${CYAN}Backend is ready for deployment${NC}"
}

# Function to create a demo user
create_demo_user() {
  print_section "Creating Demo User"

  python create_demo_user.py
  print_result "Demo user creation" "Failed to create demo user."

  echo -e "${GREEN}✓ Demo user created successfully${NC}"
}

# Function to verify features
verify_features() {
  print_section "Verifying Features"

  bash verify_features.sh
  print_result "Feature verification" "Some features failed verification."

  echo -e "${GREEN}✓ Features verified successfully${NC}"
}

# Function to clean up the project
cleanup() {
  print_section "Cleaning Up Project"

  # Remove temporary files
  echo "Removing temporary files..."
  find . -type d -name "__pycache__" -exec rm -rf {} +
  find . -type f -name "*.pyc" -delete
  find . -type f -name "*.pyo" -delete
  find . -type f -name "*.pyd" -delete
  find . -type f -name ".DS_Store" -delete
  find . -type d -name "*.egg-info" -exec rm -rf {} +
  find . -type d -name "*.egg" -exec rm -rf {} +
  find . -type d -name ".pytest_cache" -exec rm -rf {} +
  find . -type d -name ".coverage" -exec rm -rf {} +
  find . -type d -name "htmlcov" -exec rm -rf {} +
  find . -type d -name ".tox" -exec rm -rf {} +

  # Clean frontend build artifacts
  echo "Cleaning frontend build artifacts..."
  if [ -d "frontend/dist" ]; then
    rm -rf frontend/dist
  fi
  if [ -d "frontend/node_modules" ]; then
    rm -rf frontend/node_modules
  fi

  # Clean backend artifacts
  echo "Cleaning backend artifacts..."
  if [ -d "backend/__pycache__" ]; then
    rm -rf backend/__pycache__
  fi
  if [ -d "backend/.pytest_cache" ]; then
    rm -rf backend/.pytest_cache
  fi

  echo -e "${GREEN}✓ Project cleaned up successfully${NC}"
}

# Main function to handle command line arguments
main() {
  if [ $# -eq 0 ]; then
    print_usage
    exit 1
  fi

  command=$1
  shift

  case $command in
    setup)
      check_env_vars
      install_dependencies
      setup_database "$@"
      ;;
    start)
      start_dev
      ;;
    test)
      test_type=${1:-all}
      run_tests $test_type
      ;;
    build)
      build_prod
      ;;
    demo)
      create_demo_user
      ;;
    verify)
      verify_features
      ;;
    clean)
      cleanup
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Function to print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Main Control Script${NC}"
  echo -e "Usage: $0 <command> [options]"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  setup [--with-seed] [--skip-db-creation]  Setup the project (install dependencies, setup database)"
  echo -e "  start                                     Start development servers"
  echo -e "  test [backend|frontend|e2e|all]           Run tests (default: all)"
  echo -e "  build                                     Build for production"
  echo -e "  demo                                      Create a demo user"
  echo -e "  verify                                    Verify features"
  echo -e "  clean                                     Clean up project (remove temporary files, build artifacts)"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 setup --with-seed                      Setup project with seed data"
  echo -e "  $0 test backend                           Run backend tests only"
  echo -e "  $0 start                                  Start development servers"
}

# Execute main function with all arguments
main "$@"
