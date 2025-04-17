#!/bin/bash

# ======================================
# Harmonic Universe - Environment Setup Script
# ======================================
#
# This script sets up the environment files for development

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo -e "${GREEN}===== Harmonic Universe Environment Setup =====${NC}"

# Function to copy environment files
setup_env_files() {
    # Backend environment setup
    if [ -f "${BACKEND_DIR}/.env-backend" ]; then
        echo -e "${YELLOW}Setting up backend environment...${NC}"
        cp "${BACKEND_DIR}/.env-backend" "${BACKEND_DIR}/.env"
        echo -e "${GREEN}Backend environment file copied to ${BACKEND_DIR}/.env${NC}"
    else
        echo -e "${RED}Backend environment template not found!${NC}"
        echo -e "${YELLOW}Please make sure ${BACKEND_DIR}/.env-backend exists${NC}"
    fi

    # Frontend environment setup
    if [ -f "${FRONTEND_DIR}/.env-frontend" ]; then
        echo -e "${YELLOW}Setting up frontend environment...${NC}"
        cp "${FRONTEND_DIR}/.env-frontend" "${FRONTEND_DIR}/.env"
        echo -e "${GREEN}Frontend environment file copied to ${FRONTEND_DIR}/.env${NC}"
    else
        echo -e "${RED}Frontend environment template not found!${NC}"
        echo -e "${YELLOW}Please make sure ${FRONTEND_DIR}/.env-frontend exists${NC}"
    fi
}

# Check for pyenv and install if necessary
setup_pyenv() {
    echo -e "${YELLOW}Checking for pyenv...${NC}"
    if command -v pyenv &> /dev/null; then
        echo -e "${GREEN}pyenv is already installed${NC}"
    else
        echo -e "${YELLOW}Installing pyenv...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install pyenv
            echo -e "${GREEN}pyenv installed successfully${NC}"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl https://pyenv.run | bash
            echo -e "${GREEN}pyenv installed successfully${NC}"
            echo -e "${YELLOW}Please add the following to your .bashrc or .zshrc:${NC}"
            echo 'export PATH="$HOME/.pyenv/bin:$PATH"'
            echo 'eval "$(pyenv init --path)"'
            echo 'eval "$(pyenv virtualenv-init -)"'
        else
            echo -e "${RED}Unsupported OS. Please install pyenv manually${NC}"
        fi
    fi
}

# Setup Python environment using pyenv
setup_python_env() {
    echo -e "${YELLOW}Setting up Python environment...${NC}"
    
    # Check if we're in a directory with pyenv config
    if [ -f "${BACKEND_DIR}/.python-version" ]; then
        PYTHON_VERSION=$(cat "${BACKEND_DIR}/.python-version")
        echo -e "${YELLOW}Using Python version: ${PYTHON_VERSION}${NC}"
    else
        PYTHON_VERSION="3.9.1"
        echo -e "${YELLOW}No Python version specified, using default: ${PYTHON_VERSION}${NC}"
    fi
    
    # Install Python version if not already installed
    if ! pyenv versions | grep -q "$PYTHON_VERSION"; then
        echo -e "${YELLOW}Installing Python ${PYTHON_VERSION}...${NC}"
        pyenv install "$PYTHON_VERSION"
    fi
    
    # Create virtual environment
    cd "${BACKEND_DIR}"
    if [ ! -d "myenv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        pyenv local "$PYTHON_VERSION"
        python -m venv myenv
        
        # Install python-dotenv
        echo -e "${YELLOW}Installing python-dotenv...${NC}"
        source myenv/bin/activate
        pip install python-dotenv
        pip install -r requirements.txt
        deactivate
    fi
    
    echo -e "${GREEN}Python environment setup completed${NC}"
}

# Main function
main() {
    # Setup environment files
    setup_env_files
    
    # Setup pyenv if requested
    read -p "Do you want to check/install pyenv? (y/n): " setup_pyenv_answer
    if [[ "$setup_pyenv_answer" =~ ^[Yy]$ ]]; then
        setup_pyenv
        setup_python_env
    fi
    
    echo -e "${GREEN}===== Environment Setup Completed =====${NC}"
    echo -e "${YELLOW}You can now start development with:${NC}"
    echo -e "${YELLOW}  - Backend: cd backend && source myenv/bin/activate && python run.py${NC}"
    echo -e "${YELLOW}  - Frontend: cd frontend && npm run dev${NC}"
}

# Run main function
main 