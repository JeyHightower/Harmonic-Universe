#!/bin/bash
# setup.sh - Master setup script for Harmonic Universe
# This script will set up the entire application including both backend and frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

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

# Check if Python 3 is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_red "Python 3 is not installed. Please install Python 3 and try again."
        exit 1
    fi
    print_green "Python 3 is installed."
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_red "Node.js is not installed. Please install Node.js and try again."
        exit 1
    fi
    print_green "Node.js is installed."
}

# Check if PostgreSQL is installed and running
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_red "PostgreSQL is not installed. Please install PostgreSQL and try again."
        exit 1
    fi
    # Try to connect to postgres
    if ! psql -lqt &> /dev/null; then
        print_red "PostgreSQL is not running or there's a connection issue."
        print_yellow "Please start PostgreSQL service and ensure it's properly configured."
        exit 1
    fi
    print_green "PostgreSQL is installed and running."
}

# Setup backend
setup_backend() {
    print_yellow "Setting up backend..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_yellow "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_yellow "Installing backend dependencies..."
    pip install -r requirements.txt
    
    # Setup database
    print_yellow "Setting up database..."
    python setup_db.py
    
    print_green "Backend setup completed."
}

# Setup frontend
setup_frontend() {
    print_yellow "Setting up frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    print_yellow "Installing frontend dependencies..."
    npm install
    
    print_green "Frontend setup completed."
}

# Create .env file if it doesn't exist
create_env_file() {
    if [ ! -f "$ROOT_DIR/.env" ]; then
        print_yellow "Creating .env file..."
        cat > "$ROOT_DIR/.env" << EOL
# Harmonic Universe Environment Variables
FLASK_APP=wsgi.py
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/harmonic_universe
SECRET_KEY=$(openssl rand -hex 24)
ALLOWED_ORIGINS=http://localhost:5173
EOL
        print_green ".env file created at $ROOT_DIR/.env"
        print_yellow "Please review and update the values as needed."
    else
        print_yellow ".env file already exists. Skipping creation."
    fi
}

# Main function
main() {
    print_green "==== Harmonic Universe Setup ===="
    
    # Check prerequisites
    check_python
    check_node
    check_postgres
    
    # Create .env file
    create_env_file
    
    # Setup backend and frontend
    setup_backend
    setup_frontend
    
    print_green "==== Setup completed successfully ===="
    print_yellow "To start the backend server: cd backend && python run.py"
    print_yellow "To start the frontend server: cd frontend && npm run dev"
}

# Run main function
main 