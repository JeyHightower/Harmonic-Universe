#!/bin/bash

# Harmonic Universe - Utility Script
# This script provides various utility functions for the project

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
    return 1
  fi
}

# Load environment variables
load_env() {
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  else
    echo -e "${YELLOW}Warning: .env file not found, using default values${NC}"
  fi
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Clean up project
clean_project() {
  print_section "Cleaning Project"

  # Clean backend
  echo "Cleaning backend..."
  cd backend

  # Remove Python cache files
  find . -type d -name "__pycache__" -exec rm -rf {} +
  find . -type f -name "*.pyc" -delete
  find . -type f -name "*.pyo" -delete
  find . -type f -name "*.pyd" -delete
  find . -type d -name ".pytest_cache" -exec rm -rf {} +
  find . -type d -name ".coverage" -exec rm -rf {} +
  find . -type d -name "htmlcov" -exec rm -rf {} +

  print_result "Backend cleanup" "Failed to clean backend files."
  cd ..

  # Clean frontend
  echo "Cleaning frontend..."
  cd frontend

  # Remove node_modules and build directories
  if [ -d "node_modules" ]; then
    rm -rf node_modules
  fi

  if [ -d "dist" ]; then
    rm -rf dist
  fi

  if [ -d "coverage" ]; then
    rm -rf coverage
  fi

  print_result "Frontend cleanup" "Failed to clean frontend files."
  cd ..

  echo -e "${GREEN}✓ Project cleaned successfully${NC}"
}

# Generate a secret key
generate_secret_key() {
  print_section "Generating Secret Key"

  # Generate a random secret key
  if command_exists openssl; then
    secret_key=$(openssl rand -hex 32)
  else
    # Fallback to /dev/urandom if openssl is not available
    secret_key=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  fi

  echo -e "${GREEN}✓ Secret key generated:${NC} $secret_key"

  # Ask if user wants to update .env file
  read -p "Do you want to update the SECRET_KEY in .env file? (y/n): " update_env

  if [[ $update_env == "y" || $update_env == "Y" ]]; then
    if [ -f .env ]; then
      # Check if SECRET_KEY already exists in .env
      if grep -q "^SECRET_KEY=" .env; then
        # Replace existing SECRET_KEY
        sed -i.bak "s/^SECRET_KEY=.*/SECRET_KEY=$secret_key/" .env
        rm -f .env.bak
      else
        # Add SECRET_KEY to .env
        echo "SECRET_KEY=$secret_key" >> .env
      fi
      echo -e "${GREEN}✓ SECRET_KEY updated in .env file${NC}"
    else
      # Create .env file with SECRET_KEY
      echo "SECRET_KEY=$secret_key" > .env
      echo -e "${GREEN}✓ Created .env file with SECRET_KEY${NC}"
    fi
  fi
}

# Check project health
check_health() {
  print_section "Checking Project Health"

  # Check backend
  echo "Checking backend..."
  cd backend

  # Check if Python is installed
  if ! command_exists python3; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
  else
    python_version=$(python3 --version)
    echo -e "${GREEN}✓ $python_version is installed${NC}"
  fi

  # Check if pip is installed
  if ! command_exists pip; then
    echo -e "${RED}✗ pip is not installed${NC}"
  else
    pip_version=$(pip --version | awk '{print $1 " " $2}')
    echo -e "${GREEN}✓ $pip_version is installed${NC}"
  fi

  # Check if virtual environment exists
  if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
  else
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
  fi

  # Check if requirements.txt exists
  if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}✗ requirements.txt not found${NC}"
  else
    echo -e "${GREEN}✓ requirements.txt exists${NC}"
  fi

  cd ..

  # Check frontend
  echo "Checking frontend..."
  cd frontend

  # Check if Node.js is installed
  if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
  else
    node_version=$(node --version)
    echo -e "${GREEN}✓ Node.js $node_version is installed${NC}"
  fi

  # Check if npm is installed
  if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
  else
    npm_version=$(npm --version)
    echo -e "${GREEN}✓ npm $npm_version is installed${NC}"
  fi

  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found${NC}"
  else
    echo -e "${GREEN}✓ package.json exists${NC}"
  fi

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found${NC}"
  else
    echo -e "${GREEN}✓ node_modules exists${NC}"
  fi

  cd ..

  # Check database
  echo "Checking database..."

  # Load environment variables
  load_env

  # Check if PostgreSQL is installed
  if ! command_exists psql; then
    echo -e "${RED}✗ PostgreSQL client is not installed${NC}"
  else
    psql_version=$(psql --version)
    echo -e "${GREEN}✓ $psql_version is installed${NC}"
  fi

  # Check database connection
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠ DATABASE_URL not set in environment variables${NC}"
  else
    # Extract database name from DATABASE_URL
    db_name=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]*).*/\1/')

    # Check if database exists
    if command_exists psql; then
      if psql -lqt | cut -d \| -f 1 | grep -qw $db_name; then
        echo -e "${GREEN}✓ Database '$db_name' exists${NC}"
      else
        echo -e "${YELLOW}⚠ Database '$db_name' does not exist${NC}"
      fi
    fi
  fi

  # Check .env file
  echo "Checking environment variables..."

  if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
  else
    echo -e "${GREEN}✓ .env file exists${NC}"

    # Check required environment variables
    required_vars=("DATABASE_URL" "SECRET_KEY")
    for var in "${required_vars[@]}"; do
      if grep -q "^$var=" .env; then
        echo -e "${GREEN}✓ $var is set in .env${NC}"
      else
        echo -e "${YELLOW}⚠ $var is not set in .env${NC}"
      fi
    done
  fi

  echo -e "\n${BOLD}Health check complete${NC}"
}

# Create a backup
create_backup() {
  print_section "Creating Backup"

  # Create backup directory if it doesn't exist
  backup_dir="backups"
  if [ ! -d "$backup_dir" ]; then
    mkdir -p $backup_dir
  fi

  # Generate timestamp for backup filename
  timestamp=$(date +"%Y%m%d_%H%M%S")
  backup_file="$backup_dir/backup_$timestamp.tar.gz"

  # Create list of directories and files to backup
  echo "Creating backup of project files..."

  # Exclude unnecessary files and directories
  tar --exclude="*/node_modules" \
      --exclude="*/venv" \
      --exclude="*/__pycache__" \
      --exclude="*/.pytest_cache" \
      --exclude="*/dist" \
      --exclude="*/coverage" \
      --exclude="*/htmlcov" \
      --exclude="*/.git" \
      -czf $backup_file \
      backend frontend .env* *.sh

  print_result "Project files backup" "Failed to create backup of project files."

  # Backup database if PostgreSQL is installed
  if command_exists pg_dump && [ ! -z "$DATABASE_URL" ]; then
    echo "Backing up database..."

    # Extract database connection details from DATABASE_URL
    db_name=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]*).*/\1/')

    # Create database backup
    db_backup_file="$backup_dir/db_backup_$timestamp.sql"
    pg_dump $db_name > $db_backup_file

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Database backup created at $db_backup_file${NC}"

      # Add database backup to the archive
      tar -rf $backup_file $db_backup_file
      rm $db_backup_file
    else
      echo -e "${YELLOW}⚠ Failed to create database backup${NC}"
    fi
  fi

  echo -e "${GREEN}✓ Backup created successfully at $backup_file${NC}"
}

# Restore from backup
restore_backup() {
  print_section "Restoring from Backup"

  # Check if backup directory exists
  backup_dir="backups"
  if [ ! -d "$backup_dir" ]; then
    echo -e "${RED}Error: Backup directory not found${NC}"
    return 1
  fi

  # List available backups
  backups=($(ls -1 $backup_dir/backup_*.tar.gz 2>/dev/null))

  if [ ${#backups[@]} -eq 0 ]; then
    echo -e "${RED}Error: No backups found in $backup_dir${NC}"
    return 1
  fi

  echo "Available backups:"
  for i in "${!backups[@]}"; do
    echo "  $((i+1)). $(basename ${backups[$i]})"
  done

  # Ask user to select a backup
  read -p "Enter the number of the backup to restore (or 'q' to quit): " selection

  if [[ $selection == "q" || $selection == "Q" ]]; then
    echo "Restoration cancelled."
    return 0
  fi

  # Validate selection
  if ! [[ $selection =~ ^[0-9]+$ ]] || [ $selection -lt 1 ] || [ $selection -gt ${#backups[@]} ]; then
    echo -e "${RED}Error: Invalid selection${NC}"
    return 1
  fi

  # Get selected backup file
  backup_file=${backups[$((selection-1))]}

  # Create temporary directory for extraction
  temp_dir=$(mktemp -d)

  # Extract backup
  echo "Extracting backup..."
  tar -xzf $backup_file -C $temp_dir
  print_result "Backup extraction" "Failed to extract backup."

  # Restore files
  echo "Restoring project files..."

  # Copy extracted files to project directory
  cp -r $temp_dir/backup_*/backend .
  cp -r $temp_dir/backup_*/frontend .
  cp $temp_dir/backup_*/.env* . 2>/dev/null
  cp $temp_dir/backup_*/*.sh . 2>/dev/null

  print_result "Project files restoration" "Failed to restore project files."

  # Check if database backup exists
  db_backup=$(find $temp_dir -name "db_backup_*.sql" | head -n 1)

  if [ ! -z "$db_backup" ] && command_exists psql && [ ! -z "$DATABASE_URL" ]; then
    echo "Database backup found. Do you want to restore the database? (y/n): "
    read restore_db

    if [[ $restore_db == "y" || $restore_db == "Y" ]]; then
      # Extract database connection details from DATABASE_URL
      db_name=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]*).*/\1/')

      echo "Restoring database..."
      psql $db_name < $db_backup
      print_result "Database restoration" "Failed to restore database."
    fi
  fi

  # Clean up temporary directory
  rm -rf $temp_dir

  echo -e "${GREEN}✓ Restoration completed successfully${NC}"
}

# Show project info
show_info() {
  print_section "Project Information"

  # Load environment variables
  load_env

  # Project structure
  echo -e "${BOLD}Project Structure:${NC}"
  find . -type d -not -path "*/\.*" -not -path "*/node_modules*" -not -path "*/venv*" -not -path "*/__pycache__*" -maxdepth 2 | sort

  # Backend info
  echo -e "\n${BOLD}Backend Information:${NC}"
  if [ -d "backend" ]; then
    cd backend

    # Python version
    if command_exists python3; then
      python_version=$(python3 --version)
      echo "Python Version: $python_version"
    fi

    # Installed packages
    if [ -f "requirements.txt" ]; then
      echo "Required Packages:"
      cat requirements.txt | grep -v "^#" | grep -v "^$" | sort
    fi

    cd ..
  else
    echo "Backend directory not found."
  fi

  # Frontend info
  echo -e "\n${BOLD}Frontend Information:${NC}"
  if [ -d "frontend" ]; then
    cd frontend

    # Node.js version
    if command_exists node; then
      node_version=$(node --version)
      echo "Node.js Version: $node_version"
    fi

    # npm version
    if command_exists npm; then
      npm_version=$(npm --version)
      echo "npm Version: $npm_version"
    fi

    # Dependencies
    if [ -f "package.json" ]; then
      echo "Dependencies:"
      grep -A 100 '"dependencies"' package.json | grep -B 100 '"devDependencies"' | grep ":" | grep -v "dependencies" | sed 's/[",]//g' | sort
    fi

    cd ..
  else
    echo "Frontend directory not found."
  fi

  # Database info
  echo -e "\n${BOLD}Database Information:${NC}"
  if [ ! -z "$DATABASE_URL" ]; then
    # Extract database connection details from DATABASE_URL
    db_name=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]*).*/\1/')
    echo "Database Name: $db_name"

    # Check if PostgreSQL is installed
    if command_exists psql; then
      # Get database size
      db_size=$(psql -c "SELECT pg_size_pretty(pg_database_size('$db_name'));" -t $db_name 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo "Database Size: $db_size"
      fi

      # Get table count
      table_count=$(psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" -t $db_name 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo "Number of Tables: $table_count"
      fi
    fi
  else
    echo "DATABASE_URL not set in environment variables."
  fi
}

# Print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Utility Script${NC}"
  echo -e "Usage: $0 <command>"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  clean             Clean up project (remove cache files, build artifacts, etc.)"
  echo -e "  secret            Generate a new secret key"
  echo -e "  health            Check project health"
  echo -e "  backup            Create a backup of the project"
  echo -e "  restore           Restore from a backup"
  echo -e "  info              Show project information"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 clean          Clean up project files"
  echo -e "  $0 backup         Create a backup of the project"
}

# Main function
main() {
  if [ $# -eq 0 ]; then
    print_usage
    exit 1
  fi

  command=$1

  case $command in
    clean)
      clean_project
      ;;
    secret)
      generate_secret_key
      ;;
    health)
      check_health
      ;;
    backup)
      create_backup
      ;;
    restore)
      restore_backup
      ;;
    info)
      show_info
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
