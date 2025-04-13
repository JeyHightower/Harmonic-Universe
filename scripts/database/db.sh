#!/bin/bash
# db.sh - Database management script for Harmonic Universe
# This script handles database creation, backup, and restoration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
DB_NAME="harmonic_universe"
BACKUP_DIR="$ROOT_DIR/backups"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")

# Print with color
print_green() {
    echo -e "\e[32m$1\e[0m"
}

print_yellow() {
    echo -e "\e[33m$1\e[0m"
}

print_red() {
    echo -e "\e[31m$1\e[0m"
}

# Check if PostgreSQL is installed
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_red "PostgreSQL is not installed. Please install PostgreSQL and try again."
        exit 1
    fi
    print_green "PostgreSQL is installed."
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_green "Backup directory created: $BACKUP_DIR"
    fi
}

# Create the database
create_db() {
    print_yellow "Creating database..."
    
    # Check if database already exists
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_yellow "Database '$DB_NAME' already exists."
        read -p "Do you want to drop and recreate it? (y/n): " confirm
        if [[ "$confirm" == [yY] ]]; then
            dropdb "$DB_NAME"
            print_yellow "Database '$DB_NAME' dropped."
        else
            print_yellow "Database creation skipped."
            return 0
        fi
    fi
    
    # Create the database
    createdb "$DB_NAME"
    print_green "Database '$DB_NAME' created."
    
    # Initialize the database with schema
    cd "$BACKEND_DIR"
    if [ -f "setup_db.py" ]; then
        source venv/bin/activate
        python setup_db.py
        print_green "Database schema initialized."
    else
        print_red "Database schema initialization script not found."
        print_yellow "You may need to run migrations manually."
    fi
}

# Backup the database
backup_db() {
    print_yellow "Creating database backup..."
    
    # Ensure backup directory exists
    create_backup_dir
    
    # Create the backup file
    local backup_file="$BACKUP_DIR/harmonic_universe_$DATE_FORMAT.sql"
    pg_dump "$DB_NAME" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_green "Database backup created: $backup_file"
    else
        print_red "Database backup failed."
        exit 1
    fi
}

# Restore database from backup
restore_db() {
    print_yellow "Restoring database from backup..."
    
    # Ensure backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_red "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # List available backups
    local backups=("$BACKUP_DIR"/*.sql)
    if [ ${#backups[@]} -eq 0 ]; then
        print_red "No backup files found in $BACKUP_DIR"
        exit 1
    fi
    
    print_yellow "Available backups:"
    for i in "${!backups[@]}"; do
        echo "$((i+1)). $(basename "${backups[$i]}")"
    done
    
    # Prompt for backup selection
    read -p "Enter the number of the backup to restore: " backup_num
    
    if [[ ! "$backup_num" =~ ^[0-9]+$ || "$backup_num" -lt 1 || "$backup_num" -gt "${#backups[@]}" ]]; then
        print_red "Invalid selection. Please enter a number between 1 and ${#backups[@]}."
        exit 1
    fi
    
    local selected_backup="${backups[$((backup_num-1))]}"
    print_yellow "Selected backup: $(basename "$selected_backup")"
    
    # Check if database exists and drop if necessary
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        read -p "Database '$DB_NAME' exists. Drop it before restoring? (y/n): " confirm
        if [[ "$confirm" == [yY] ]]; then
            dropdb "$DB_NAME"
            print_yellow "Database '$DB_NAME' dropped."
        else
            print_red "Cannot restore to existing database without dropping it first."
            exit 1
        fi
    fi
    
    # Create new database
    createdb "$DB_NAME"
    print_green "Database '$DB_NAME' created."
    
    # Restore from backup
    psql "$DB_NAME" < "$selected_backup"
    
    if [ $? -eq 0 ]; then
        print_green "Database restored successfully from: $(basename "$selected_backup")"
    else
        print_red "Database restoration failed."
        exit 1
    fi
}

# Run migrations
run_migrations() {
    print_yellow "Running database migrations..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    if [ -d "migrations" ]; then
        flask db upgrade
        print_green "Migrations applied successfully."
    else
        print_yellow "No migrations directory found."
        read -p "Initialize migrations? (y/n): " confirm
        if [[ "$confirm" == [yY] ]]; then
            flask db init
            print_green "Migrations initialized."
            flask db migrate -m "Initial migration"
            print_green "Initial migration created."
            flask db upgrade
            print_green "Initial migration applied."
        else
            print_yellow "Migration initialization skipped."
        fi
    fi
}

# Show database connection info
show_db_info() {
    print_yellow "Database Information:"
    echo "Database Name: $DB_NAME"
    echo "Connection String: postgresql://postgres:postgres@localhost:5432/$DB_NAME"
    echo ""
    echo "To connect using psql: psql $DB_NAME"
    
    # Show tables if possible
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo ""
        print_yellow "Tables in $DB_NAME:"
        psql -d "$DB_NAME" -c "\dt"
    fi
}

# Show usage help
show_help() {
    echo "Harmonic Universe Database Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  create     Create the database and initialize schema"
    echo "  backup     Backup the database"
    echo "  restore    Restore the database from a backup"
    echo "  migrate    Run database migrations"
    echo "  info       Show database information"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 create   # Create the database"
    echo "  $0 backup   # Backup the database"
}

# Main function
main() {
    # Check prerequisites
    check_postgres
    
    # Process command
    local command=$1
    
    case "$command" in
        create)
            create_db
            ;;
        backup)
            backup_db
            ;;
        restore)
            restore_db
            ;;
        migrate)
            run_migrations
            ;;
        info)
            show_db_info
            ;;
        help|"")
            show_help
            ;;
        *)
            print_red "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments passed to the script
main "$@" 