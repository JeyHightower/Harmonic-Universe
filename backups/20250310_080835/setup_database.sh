#!/bin/bash

# Harmonic Universe - Database Setup Script
# This script handles all database-related operations

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
    echo -e "${YELLOW}Warning: .env file not found. Using default values.${NC}"
    # Set default values
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/harmonic_universe"
    export DATABASE_NAME="harmonic_universe"
    export DATABASE_USER="postgres"
    export DATABASE_PASSWORD="postgres"
    export DATABASE_HOST="localhost"
    export DATABASE_PORT="5432"
  fi
}

# Create database
create_database() {
  print_section "Creating Database"

  echo "Creating database if it doesn't exist..."
  python backend/scripts/create_db.py
  print_result "Database creation" "Failed to create database. Check your PostgreSQL configuration."

  echo -e "${GREEN}✓ Database created successfully${NC}"
}

# Run migrations
run_migrations() {
  print_section "Running Migrations"

  echo "Running database migrations..."
  cd backend && python -m alembic upgrade head
  print_result "Database migrations" "Failed to run migrations."
  cd ..

  echo -e "${GREEN}✓ Migrations applied successfully${NC}"
}

# Seed database
seed_database() {
  print_section "Seeding Database"

  echo "Seeding database with initial data..."
  python backend/app/seeds/seed.py
  print_result "Database seeding" "Failed to seed database."

  echo -e "${GREEN}✓ Database seeded successfully${NC}"
}

# Reset database
reset_database() {
  print_section "Resetting Database"

  echo "Dropping all tables..."
  cd backend && python -m alembic downgrade base
  print_result "Database reset" "Failed to reset database."
  cd ..

  echo "Running migrations to recreate tables..."
  cd backend && python -m alembic upgrade head
  print_result "Database recreation" "Failed to recreate database."
  cd ..

  echo -e "${GREEN}✓ Database reset successfully${NC}"
}

# Backup database
backup_database() {
  print_section "Backing Up Database"

  # Create backups directory if it doesn't exist
  mkdir -p backups

  # Generate timestamp for backup file
  timestamp=$(date +"%Y%m%d_%H%M%S")
  backup_file="backups/harmonic_universe_${timestamp}.sql"

  # Extract database connection details from DATABASE_URL
  db_name=${DATABASE_NAME:-harmonic_universe}
  db_user=${DATABASE_USER:-postgres}
  db_host=${DATABASE_HOST:-localhost}
  db_port=${DATABASE_PORT:-5432}

  echo "Creating backup to ${backup_file}..."
  PGPASSWORD=${DATABASE_PASSWORD} pg_dump -h ${db_host} -p ${db_port} -U ${db_user} -F p -f ${backup_file} ${db_name}
  print_result "Database backup" "Failed to backup database."

  echo -e "${GREEN}✓ Database backed up to ${backup_file}${NC}"
}

# Restore database from backup
restore_database() {
  print_section "Restoring Database"

  if [ -z "$1" ]; then
    # Find the most recent backup
    backup_file=$(ls -t backups/harmonic_universe_*.sql 2>/dev/null | head -1)

    if [ -z "$backup_file" ]; then
      echo -e "${RED}No backup files found in backups/ directory${NC}"
      exit 1
    fi
  else
    backup_file=$1

    if [ ! -f "$backup_file" ]; then
      echo -e "${RED}Backup file not found: ${backup_file}${NC}"
      exit 1
    fi
  fi

  # Extract database connection details from DATABASE_URL
  db_name=${DATABASE_NAME:-harmonic_universe}
  db_user=${DATABASE_USER:-postgres}
  db_host=${DATABASE_HOST:-localhost}
  db_port=${DATABASE_PORT:-5432}

  echo "Restoring from ${backup_file}..."
  PGPASSWORD=${DATABASE_PASSWORD} psql -h ${db_host} -p ${db_port} -U ${db_user} -d ${db_name} -f ${backup_file}
  print_result "Database restore" "Failed to restore database."

  echo -e "${GREEN}✓ Database restored successfully${NC}"
}

# Check database status
check_database() {
  print_section "Checking Database Status"

  # Extract database connection details from DATABASE_URL
  db_name=${DATABASE_NAME:-harmonic_universe}
  db_user=${DATABASE_USER:-postgres}
  db_host=${DATABASE_HOST:-localhost}
  db_port=${DATABASE_PORT:-5432}

  echo "Checking database connection..."
  PGPASSWORD=${DATABASE_PASSWORD} psql -h ${db_host} -p ${db_port} -U ${db_user} -d ${db_name} -c "SELECT 1" > /dev/null 2>&1
  print_result "Database connection" "Failed to connect to database."

  echo "Checking database tables..."
  python backend/check_tables.py
  print_result "Database tables" "Failed to check database tables."

  echo -e "${GREEN}✓ Database check completed successfully${NC}"
}

# Print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Database Setup Script${NC}"
  echo -e "Usage: $0 <command> [options]"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  create    Create the database if it doesn't exist"
  echo -e "  migrate   Run database migrations"
  echo -e "  seed      Seed the database with initial data"
  echo -e "  reset     Reset the database (drop all tables and recreate)"
  echo -e "  backup    Backup the database"
  echo -e "  restore   Restore the database from backup"
  echo -e "  check     Check database status"
  echo -e "  all       Run create, migrate, and seed operations"
  echo
  echo -e "${BOLD}Options:${NC}"
  echo -e "  restore <file>   Specify backup file to restore from"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 all           Setup database completely"
  echo -e "  $0 backup        Create a database backup"
  echo -e "  $0 restore       Restore from the most recent backup"
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
  shift

  case $command in
    create)
      create_database
      ;;
    migrate)
      run_migrations
      ;;
    seed)
      seed_database
      ;;
    reset)
      reset_database
      ;;
    backup)
      backup_database
      ;;
    restore)
      restore_database "$1"
      ;;
    check)
      check_database
      ;;
    all)
      create_database
      run_migrations
      seed_database
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
