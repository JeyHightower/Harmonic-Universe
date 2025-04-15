#!/bin/bash
# start.sh - Start the Harmonic Universe application
# This script starts both the backend and frontend development servers

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

# Check if Python virtual environment exists
check_backend() {
    # Check if pyenv exists first
    if command -v pyenv &> /dev/null; then
        if pyenv virtualenvs | grep -q "myenv"; then
            print_green "Backend environment (pyenv myenv) found."
            return 0
        fi
    # Fall back to checking for directory
    elif [ -d "$BACKEND_DIR/myenv" ]; then
        print_green "Backend environment (myenv directory) found."
        return 0
    else
        print_red "Backend virtual environment not found. Please ensure myenv is created with pyenv."
        exit 1
    fi
}

# Check if frontend dependencies are installed
check_frontend() {
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_red "Frontend dependencies not found. Please run setup.sh first."
        exit 1
    fi
    print_green "Frontend dependencies found."
}

# Check if PostgreSQL is running
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
    print_green "PostgreSQL is running."
}

# Start backend server
start_backend() {
    print_yellow "Starting backend server..."
    cd "$BACKEND_DIR"
    
    # Activate virtual environment using pyenv
    if command -v pyenv &> /dev/null; then
        eval "$(pyenv init -)"
        eval "$(pyenv virtualenv-init -)"
        pyenv activate myenv || print_yellow "Failed to activate myenv via pyenv activate, falling back to pyenv shell"
        pyenv shell myenv
    elif [ -d "myenv" ]; then
        source myenv/bin/activate
    else
        print_red "Virtual environment not found. Please ensure myenv is created with pyenv."
        exit 1
    fi
    
    # Start the backend server in the background
    python run.py &
    BACKEND_PID=$!
    print_green "Backend server started with PID: $BACKEND_PID"
}

# Start frontend server
start_frontend() {
    print_yellow "Starting frontend server..."
    cd "$FRONTEND_DIR"
    
    # Start the frontend server in the background
    npm run dev &
    FRONTEND_PID=$!
    print_green "Frontend server started with PID: $FRONTEND_PID"
}

# Handle cleanup when the script is terminated
cleanup() {
    print_yellow "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_green "Servers shut down."
    exit 0
}

# Set up trap to catch SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Main function
main() {
    print_green "==== Starting Harmonic Universe Application ===="
    
    # Check prerequisites
    check_backend
    check_frontend
    check_postgres
    
    # Start servers
    start_backend
    start_frontend
    
    print_green "==== Harmonic Universe is running ===="
    print_yellow "Backend server: http://localhost:5001"
    print_yellow "Frontend server: http://localhost:5173"
    print_yellow "Press Ctrl+C to stop both servers."
    
    # Keep the script running
    wait
}

# Run main function
main 