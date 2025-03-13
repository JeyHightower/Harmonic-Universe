#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is required but not installed.${NC}"
        exit 1
    fi
}

# Check required commands
check_command "python3"
check_command "npm"
check_command "node"

# Function to start backend
start_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    flask run &
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${GREEN}Starting frontend server...${NC}"
    cd frontend
    npm install
    npm run dev &
    cd ..
}

# Function to setup database
setup_database() {
    echo -e "${GREEN}Setting up database...${NC}"
    cd backend
    source venv/bin/activate
    flask db upgrade
    cd ..
}

# Function to clean up processes
cleanup() {
    echo -e "${GREEN}Cleaning up processes...${NC}"
    pkill -f "flask run"
    pkill -f "npm run dev"
}

# Main execution
case "$1" in
    "start")
        start_backend
        start_frontend
        ;;
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "setup")
        setup_database
        ;;
    "stop")
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|backend|frontend|setup|stop}"
        exit 1
        ;;
esac

trap cleanup EXIT
