#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling
set -e
trap 'echo -e "${RED}Setup failed${NC}" >&2' ERR

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}Created directory: $1${NC}"
    fi
}

# Function to setup backend test structure
setup_backend_tests() {
    echo -e "${BLUE}Setting up backend test structure...${NC}"

    # Create test directories
    create_dir "backend/tests/unit/models"
    create_dir "backend/tests/unit/routes"
    create_dir "backend/tests/unit/services"
    create_dir "backend/tests/integration/api"
    create_dir "backend/tests/integration/websocket"
    create_dir "backend/tests/fixtures"

    # Create __init__.py files
    touch "backend/tests/__init__.py"
    touch "backend/tests/unit/__init__.py"
    touch "backend/tests/integration/__init__.py"
    touch "backend/tests/fixtures/__init__.py"

    # Create conftest.py if it doesn't exist
    if [ ! -f "backend/tests/conftest.py" ]; then
        echo "Creating conftest.py..."
        cat > "backend/tests/conftest.py" << 'EOL'
import pytest
from app import create_app
from app.models import db as _db
from config import TestConfig

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app(TestConfig)
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session

    yield session

    transaction.rollback()
    connection.close()
    session.remove()
EOL
    fi
}

# Function to setup frontend test structure
setup_frontend_tests() {
    echo -e "${BLUE}Setting up frontend test structure...${NC}"

    # Create test directories
    create_dir "frontend/src/tests/components"
    create_dir "frontend/src/tests/hooks"
    create_dir "frontend/src/tests/store"
    create_dir "frontend/src/tests/utils"
    create_dir "frontend/src/tests/integration"
    create_dir "frontend/cypress/e2e"
    create_dir "frontend/cypress/fixtures"
    create_dir "frontend/cypress/support"

    # Create test setup file if it doesn't exist
    if [ ! -f "frontend/src/tests/setup.js" ]; then
        echo "Creating test setup file..."
        cat > "frontend/src/tests/setup.js" << 'EOL'
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())
EOL
    fi

    # Create Cypress support file if it doesn't exist
    if [ ! -f "frontend/cypress/support/e2e.js" ]; then
        echo "Creating Cypress support file..."
        cat > "frontend/cypress/support/e2e.js" << 'EOL'
// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

beforeEach(() => {
  // Reset the database state before each test
  cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`)
})
EOL
    fi
}

# Main execution
main() {
    # Ensure we're in the project root directory
    cd "$(dirname "$0")/.."

    echo -e "${BLUE}Setting up test environment...${NC}"

    # Clean up existing test files
    echo -e "${BLUE}Cleaning up existing test files...${NC}"
    rm -rf backend/tests/*
    rm -rf frontend/src/tests/*
    rm -rf frontend/cypress/e2e/*

    # Setup test structure
    setup_backend_tests
    setup_frontend_tests

    echo -e "${GREEN}Test setup completed successfully!${NC}"
}

# Run main function
main
