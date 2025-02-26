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
  fi
}

# Consolidated script runner function
run_script() {
  print_section "Running Script: $1"

  case $1 in
    install)
      echo "Installing all dependencies..."
      npm run install:all
      ;;
    build)
      echo "Building the application..."
      npm run build
      ;;
    test)
      echo "Running all tests..."
      npm run test
      ;;
    test:frontend)
      echo "Running frontend tests..."
      npm run test:frontend
      ;;
    test:backend)
      echo "Running backend tests..."
      npm run test:backend
      ;;
    lint)
      echo "Running linting checks..."
      npm run lint
      ;;
    lint:frontend)
      echo "Running frontend linting..."
      npm run lint:frontend
      ;;
    lint:backend)
      echo "Running backend linting..."
      npm run lint:backend
      ;;
    clean)
      echo "Cleaning project files..."
      npm run clean
      ;;
    *)
      echo -e "${RED}Unknown script: $1${NC}"
      echo "Available scripts: install, build, test, test:frontend, test:backend, lint, lint:frontend, lint:backend, clean"
      ;;
  esac

  print_result "Script execution completed"
}

# Environment check
check_environment() {
  print_section "Environment Check"

  # Check if Python is installed
  python3 --version > /dev/null 2>&1
  print_result "Python installed" "Please install Python 3.8+"

  # Check if Node.js is installed
  node --version > /dev/null 2>&1
  print_result "Node.js installed" "Please install Node.js 14+"

  # Check if required files exist
  [ -f "./backend/.env" ] || echo -e "${YELLOW}⚠ backend/.env file missing${NC}"
  [ -f "./frontend/.env" ] || echo -e "${YELLOW}⚠ frontend/.env file missing${NC}"

  # Check if Docker is installed (optional)
  if docker --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker installed${NC}"
  else
    echo -e "${YELLOW}⚠ Docker not found (optional)${NC}"
  fi
}

# Setup operations
setup() {
  print_section "Setting up Harmonic Universe"

  # Create virtual environment if it doesn't exist
  if [ ! -d "./backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
    print_result "Virtual environment created"
  fi

  # Activate virtual environment and install dependencies
  echo "Installing backend dependencies..."
  cd backend || exit
  source venv/bin/activate
  pip install -r requirements.txt
  print_result "Backend dependencies installed"

  # Initialize the database
  echo "Initializing database..."
  python -m app.scripts.init_db
  print_result "Database initialized"

  # Create demo user
  echo "Creating demo user..."
  python create_demo_user.py
  print_result "Demo user created"

  # Return to root and install frontend dependencies
  cd ..
  echo "Installing frontend dependencies..."
  cd frontend || exit
  npm install
  print_result "Frontend dependencies installed"

  cd ..
  echo -e "${GREEN}${BOLD}Setup complete!${NC}"
}

# Database operations
db_operations() {
  print_section "Database Operations"

  case $1 in
    migrate)
      echo "Running database migrations..."
      cd backend || exit
      source venv/bin/activate
      python -m alembic upgrade head
      print_result "Database migrations applied"
      cd ..
      ;;
    reset)
      echo "Resetting database..."
      cd backend || exit
      source venv/bin/activate
      python -m app.scripts.db_ops --reset
      print_result "Database reset"
      cd ..
      ;;
    backup)
      echo "Backing up database..."
      cd backend || exit
      source venv/bin/activate
      python -m app.scripts.db_ops --backup
      print_result "Database backed up"
      cd ..
      ;;
    restore)
      echo "Restoring database from backup..."
      cd backend || exit
      source venv/bin/activate
      python -m app.scripts.db_ops --restore
      print_result "Database restored"
      cd ..
      ;;
    *)
      echo "Available database operations:"
      echo "  migrate  - Run database migrations"
      echo "  reset    - Reset database to initial state"
      echo "  backup   - Backup the database"
      echo "  restore  - Restore from the latest backup"
      ;;
  esac
}

# Development server operations
run_dev() {
  print_section "Development Servers"

  case $1 in
    backend)
      echo "Starting backend development server..."
      cd backend || exit
      source venv/bin/activate
      python run.py
      ;;
    frontend)
      echo "Starting frontend development server..."
      cd frontend || exit
      npm run dev
      ;;
    *)
      echo "Starting both backend and frontend servers..."
      # Start backend in the background
      gnome-terminal -- bash -c "cd backend && source venv/bin/activate && python run.py" 2>/dev/null ||
      osascript -e 'tell app "Terminal" to do script "cd '$PWD'/backend && source venv/bin/activate && python run.py"' 2>/dev/null ||
      xterm -e "cd backend && source venv/bin/activate && python run.py" 2>/dev/null ||
      echo -e "${YELLOW}⚠ Could not open a new terminal for the backend server${NC}"

      # Start frontend
      cd frontend || exit
      npm run dev
      ;;
  esac
}

# Testing operations
run_tests() {
  print_section "Running Tests"

  case $1 in
    backend)
      echo "Running backend tests..."
      cd backend || exit
      source venv/bin/activate
      python -m pytest
      print_result "Backend tests"
      cd ..
      ;;
    frontend)
      echo "Running frontend tests..."
      cd frontend || exit
      npm test
      print_result "Frontend tests"
      cd ..
      ;;
    api)
      echo "Running API tests..."
      cd backend || exit
      source venv/bin/activate
      bash test_physics_curl.sh
      cd ..
      ;;
    music)
      echo "Running music API tests..."
      cd backend || exit
      source venv/bin/activate
      python test_music_api.py
      cd ..
      ;;
    all)
      run_tests backend
      run_tests frontend
      run_tests api
      run_tests music
      ;;
    *)
      echo "Available test operations:"
      echo "  backend  - Run backend unit tests"
      echo "  frontend - Run frontend tests"
      echo "  api      - Run API tests"
      echo "  music    - Run music API tests"
      echo "  all      - Run all tests"
      ;;
  esac
}

# Build operations
build() {
  print_section "Building for Production"

  case $1 in
    frontend)
      echo "Building frontend..."
      cd frontend || exit
      npm run build
      print_result "Frontend build"
      cd ..
      ;;
    docker)
      echo "Building Docker containers..."
      docker-compose build
      print_result "Docker build"
      ;;
    all)
      build frontend
      build docker
      ;;
    *)
      echo "Available build operations:"
      echo "  frontend - Build frontend for production"
      echo "  docker   - Build Docker containers"
      echo "  all      - Build everything"
      ;;
  esac
}

# Deployment operations
deploy() {
  print_section "Deployment"

  case $1 in
    docker)
      echo "Deploying with Docker..."
      docker-compose up -d
      print_result "Docker deployment"
      ;;
    *)
      echo "Available deployment operations:"
      echo "  docker   - Deploy using Docker Compose"
      ;;
  esac
}

# Cleanup operations
cleanup() {
  print_section "Cleanup Operations"

  case $1 in
    logs)
      echo "Cleaning up log files..."
      find . -name "*.log" -type f -delete
      print_result "Log files cleaned"
      ;;
    temp)
      echo "Cleaning up temporary files..."
      find . -name "__pycache__" -type d -exec rm -rf {} +
      find . -name "*.pyc" -type f -delete
      find . -name ".pytest_cache" -type d -exec rm -rf {} +
      find . -name ".coverage" -type f -delete
      find . -name ".eslintcache" -type f -delete
      print_result "Temporary files cleaned"
      ;;
    builds)
      echo "Cleaning up build files..."
      rm -rf backend/dist frontend/dist frontend/build
      print_result "Build files cleaned"
      ;;
    all)
      cleanup logs
      cleanup temp
      cleanup builds
      echo "Removing old uploads..."
      find backend/uploads -mtime +30 -type f -delete 2>/dev/null
      print_result "Old uploads cleaned"
      ;;
    *)
      echo "Available cleanup operations:"
      echo "  logs   - Clean up log files"
      echo "  temp   - Clean up temporary files (pycache, etc.)"
      echo "  builds - Clean up build directories"
      echo "  all    - Clean up everything"
      ;;
  esac
}

# Show help information
show_help() {
  echo -e "${BOLD}Harmonic Universe - Main Control Script${NC}"
  echo ""
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  check             Check environment setup"
  echo "  setup             Set up the project (virtual env, dependencies, etc.)"
  echo "  db [operation]    Perform database operations"
  echo "  dev [target]      Start development servers"
  echo "  test [target]     Run tests"
  echo "  build [target]    Build for production"
  echo "  deploy [method]   Deploy the application"
  echo "  cleanup [target]  Clean up project files"
  echo "  script [name]     Run consolidated scripts (install, build, test, lint, clean)"
  echo "  help              Show this help message"
  echo ""
  echo "Run '$0 [command]' without options to see available subcommands."
}

# Main execution
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case $1 in
  check)
    check_environment
    ;;
  setup)
    setup
    ;;
  db)
    db_operations "$2"
    ;;
  dev)
    run_dev "$2"
    ;;
  test)
    run_tests "$2"
    ;;
  build)
    build "$2"
    ;;
  script)
    run_script "$2"
    ;;
  deploy)
    deploy "$2"
    ;;
  cleanup)
    cleanup "$2"
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Unknown command: $1${NC}"
    show_help
    exit 1
    ;;
esac
