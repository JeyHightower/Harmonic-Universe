#!/bin/bash

# Harmonic Universe - Development Script
# This script handles all development-related operations

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
    echo -e "${YELLOW}Warning: .env file not found, using default values${NC}"
  fi
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Setup development environment
setup_dev_env() {
  print_section "Setting Up Development Environment"

  # Create virtual environment for backend
  echo "Setting up backend virtual environment..."
  cd backend

  if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
  fi

  if ! command_exists pip; then
    echo -e "${RED}Error: pip is not installed. Please install pip and try again.${NC}"
    exit 1
  fi

  if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_result "Virtual environment creation" "Failed to create virtual environment."
  fi

  # Activate virtual environment and install dependencies
  echo "Installing backend dependencies..."
  source venv/bin/activate
  pip install -r requirements.txt
  print_result "Backend dependencies installation" "Failed to install backend dependencies."
  deactivate
  cd ..

  # Setup frontend dependencies
  echo "Setting up frontend dependencies..."
  cd frontend

  if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm, then try again.${NC}"
    exit 1
  fi

  npm install
  print_result "Frontend dependencies installation" "Failed to install frontend dependencies."
  cd ..

  # Create .env file if it doesn't exist
  if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || touch .env
    echo "# Harmonic Universe Environment Variables" >> .env
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/harmonic_universe" >> .env
    echo "SECRET_KEY=development_secret_key" >> .env
    echo "DEBUG=True" >> .env
    echo "FRONTEND_URL=http://localhost:5173" >> .env
    echo "BACKEND_URL=http://localhost:8000" >> .env
    print_result "Environment file creation" "Failed to create .env file."
  fi

  echo -e "${GREEN}✓ Development environment setup complete${NC}"
}

# Start backend development server
start_backend() {
  print_section "Starting Backend Development Server"

  cd backend

  # Activate virtual environment
  source venv/bin/activate

  # Start backend server
  echo "Starting backend server..."
  python -m app.main

  # Deactivate virtual environment when server stops
  deactivate
  cd ..
}

# Start frontend development server
start_frontend() {
  print_section "Starting Frontend Development Server"

  cd frontend

  # Start frontend server
  echo "Starting frontend server..."
  npm run dev

  cd ..
}

# Start both backend and frontend servers
start_dev() {
  print_section "Starting Development Servers"

  # Start backend server in background
  echo "Starting backend server..."
  cd backend
  source venv/bin/activate
  python -m app.main &
  BACKEND_PID=$!
  cd ..

  # Wait for backend to start
  echo "Waiting for backend to start..."
  sleep 3

  # Start frontend server in a new terminal
  echo "Starting frontend server..."
  if command_exists osascript; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/frontend && npm run dev\""
  elif command_exists gnome-terminal; then
    # Linux with GNOME
    gnome-terminal -- bash -c "cd $(pwd)/frontend && npm run dev; exec bash"
  elif command_exists xterm; then
    # Linux with X
    xterm -e "cd $(pwd)/frontend && npm run dev" &
  else
    # Fallback: run in background
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    # Trap Ctrl+C to kill both processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

    # Wait for frontend process
    wait $FRONTEND_PID
  fi

  # Wait for backend process if frontend is in a separate terminal
  if [ -z "$FRONTEND_PID" ]; then
    wait $BACKEND_PID
  fi
}

# Generate API documentation
generate_api_docs() {
  print_section "Generating API Documentation"

  cd backend

  # Activate virtual environment
  source venv/bin/activate

  # Check if required packages are installed
  if ! pip show sphinx &>/dev/null; then
    echo "Installing Sphinx and related packages..."
    pip install sphinx sphinx-rtd-theme
    print_result "Sphinx installation" "Failed to install Sphinx."
  fi

  # Generate API documentation
  echo "Generating API documentation..."
  if [ ! -d "docs" ]; then
    mkdir -p docs
  fi

  # Generate OpenAPI spec
  python -c "from app.main import app; import json; print(json.dumps(app.openapi()))" > docs/openapi.json
  print_result "OpenAPI spec generation" "Failed to generate OpenAPI spec."

  # Convert to HTML (optional)
  if command_exists npx; then
    echo "Converting OpenAPI spec to HTML..."
    npx redoc-cli bundle docs/openapi.json -o docs/index.html
    print_result "HTML documentation generation" "Failed to generate HTML documentation."
  fi

  # Deactivate virtual environment
  deactivate
  cd ..

  echo -e "${GREEN}✓ API documentation generated successfully${NC}"
  echo -e "${CYAN}Documentation available at: backend/docs/index.html${NC}"
}

# Create a new component
create_component() {
  print_section "Creating New Component"

  if [ -z "$1" ]; then
    echo -e "${RED}Error: Component name is required${NC}"
    echo "Usage: $0 create-component ComponentName"
    exit 1
  fi

  component_name=$1

  # Create component directory and files
  echo "Creating component: $component_name"
  cd frontend

  component_dir="src/components/$component_name"
  mkdir -p $component_dir

  # Create component file
  cat > $component_dir/$component_name.jsx << EOF
import React from 'react';
import './$component_name.css';

const $component_name = (props) => {
  return (
    <div className="$component_name">
      <h2>$component_name Component</h2>
    </div>
  );
};

export default $component_name;
EOF

  # Create CSS file
  cat > $component_dir/$component_name.css << EOF
.$component_name {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  background-color: #f5f5f5;
}
EOF

  # Create test file
  cat > $component_dir/$component_name.test.jsx << EOF
import React from 'react';
import { render, screen } from '@testing-library/react';
import $component_name from './$component_name';

describe('$component_name', () => {
  test('renders correctly', () => {
    render(<$component_name />);
    expect(screen.getByText('$component_name Component')).toBeInTheDocument();
  });
});
EOF

  # Create index file for easy importing
  cat > $component_dir/index.js << EOF
export { default } from './$component_name';
EOF

  cd ..

  echo -e "${GREEN}✓ Component $component_name created successfully${NC}"
  echo -e "${CYAN}Component files created at: frontend/src/components/$component_name/${NC}"
}

# Create a new API endpoint
create_endpoint() {
  print_section "Creating New API Endpoint"

  if [ -z "$1" ]; then
    echo -e "${RED}Error: Endpoint name is required${NC}"
    echo "Usage: $0 create-endpoint endpoint_name"
    exit 1
  fi

  endpoint_name=$1

  # Create endpoint files
  echo "Creating endpoint: $endpoint_name"
  cd backend

  # Create router file
  mkdir -p app/routers

  cat > app/routers/${endpoint_name}.py << EOF
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ${endpoint_name} as schemas
from app.crud import ${endpoint_name} as crud

router = APIRouter(
    prefix="/${endpoint_name}s",
    tags=["${endpoint_name}s"],
    responses={404: {"description": "${endpoint_name} not found"}},
)


@router.get("/", response_model=list[schemas.${endpoint_name^}])
def read_${endpoint_name}s(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ${endpoint_name}s = crud.get_${endpoint_name}s(db, skip=skip, limit=limit)
    return ${endpoint_name}s


@router.post("/", response_model=schemas.${endpoint_name^})
def create_${endpoint_name}(${endpoint_name}: schemas.${endpoint_name^}Create, db: Session = Depends(get_db)):
    return crud.create_${endpoint_name}(db=db, ${endpoint_name}=${endpoint_name})


@router.get("/{${endpoint_name}_id}", response_model=schemas.${endpoint_name^})
def read_${endpoint_name}(${endpoint_name}_id: int, db: Session = Depends(get_db)):
    db_${endpoint_name} = crud.get_${endpoint_name}(db, ${endpoint_name}_id=${endpoint_name}_id)
    if db_${endpoint_name} is None:
        raise HTTPException(status_code=404, detail="${endpoint_name} not found")
    return db_${endpoint_name}


@router.put("/{${endpoint_name}_id}", response_model=schemas.${endpoint_name^})
def update_${endpoint_name}(
    ${endpoint_name}_id: int, ${endpoint_name}: schemas.${endpoint_name^}Update, db: Session = Depends(get_db)
):
    db_${endpoint_name} = crud.get_${endpoint_name}(db, ${endpoint_name}_id=${endpoint_name}_id)
    if db_${endpoint_name} is None:
        raise HTTPException(status_code=404, detail="${endpoint_name} not found")
    return crud.update_${endpoint_name}(db=db, ${endpoint_name}_id=${endpoint_name}_id, ${endpoint_name}=${endpoint_name})


@router.delete("/{${endpoint_name}_id}", response_model=schemas.${endpoint_name^})
def delete_${endpoint_name}(${endpoint_name}_id: int, db: Session = Depends(get_db)):
    db_${endpoint_name} = crud.get_${endpoint_name}(db, ${endpoint_name}_id=${endpoint_name}_id)
    if db_${endpoint_name} is None:
        raise HTTPException(status_code=404, detail="${endpoint_name} not found")
    return crud.delete_${endpoint_name}(db=db, ${endpoint_name}_id=${endpoint_name}_id)
EOF

  # Create schema file
  mkdir -p app/schemas

  cat > app/schemas/${endpoint_name}.py << EOF
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ${endpoint_name^}Base(BaseModel):
    name: str
    description: Optional[str] = None


class ${endpoint_name^}Create(${endpoint_name^}Base):
    pass


class ${endpoint_name^}Update(${endpoint_name^}Base):
    name: Optional[str] = None


class ${endpoint_name^}(${endpoint_name^}Base):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
EOF

  # Create CRUD file
  mkdir -p app/crud

  cat > app/crud/${endpoint_name}.py << EOF
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.models.${endpoint_name} import ${endpoint_name^}
from app.schemas.${endpoint_name} import ${endpoint_name^}Create, ${endpoint_name^}Update


def get_${endpoint_name}(db: Session, ${endpoint_name}_id: int):
    return db.query(${endpoint_name^}).filter(${endpoint_name^}.id == ${endpoint_name}_id).first()


def get_${endpoint_name}s(db: Session, skip: int = 0, limit: int = 100):
    return db.query(${endpoint_name^}).offset(skip).limit(limit).all()


def create_${endpoint_name}(db: Session, ${endpoint_name}: ${endpoint_name^}Create):
    db_${endpoint_name} = ${endpoint_name^}(**${endpoint_name}.dict())
    db.add(db_${endpoint_name})
    db.commit()
    db.refresh(db_${endpoint_name})
    return db_${endpoint_name}


def update_${endpoint_name}(db: Session, ${endpoint_name}_id: int, ${endpoint_name}: ${endpoint_name^}Update):
    db_${endpoint_name} = get_${endpoint_name}(db, ${endpoint_name}_id=${endpoint_name}_id)

    obj_data = jsonable_encoder(db_${endpoint_name})
    update_data = ${endpoint_name}.dict(exclude_unset=True)

    for field in obj_data:
        if field in update_data:
            setattr(db_${endpoint_name}, field, update_data[field])

    db.add(db_${endpoint_name})
    db.commit()
    db.refresh(db_${endpoint_name})
    return db_${endpoint_name}


def delete_${endpoint_name}(db: Session, ${endpoint_name}_id: int):
    db_${endpoint_name} = get_${endpoint_name}(db, ${endpoint_name}_id=${endpoint_name}_id)
    db.delete(db_${endpoint_name})
    db.commit()
    return db_${endpoint_name}
EOF

  # Create model file
  mkdir -p app/models

  cat > app/models/${endpoint_name}.py << EOF
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class ${endpoint_name^}(Base):
    __tablename__ = "${endpoint_name}s"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
EOF

  # Create test file
  mkdir -p tests/api

  cat > tests/api/test_${endpoint_name}.py << EOF
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_${endpoint_name}():
    response = client.post(
        "/${endpoint_name}s/",
        json={"name": "Test ${endpoint_name^}", "description": "Test description"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test ${endpoint_name^}"
    assert data["description"] == "Test description"
    assert "id" in data


def test_read_${endpoint_name}():
    # First create a ${endpoint_name}
    response = client.post(
        "/${endpoint_name}s/",
        json={"name": "Test ${endpoint_name^}", "description": "Test description"},
    )
    data = response.json()
    ${endpoint_name}_id = data["id"]

    # Then read it
    response = client.get(f"/${endpoint_name}s/{${endpoint_name}_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test ${endpoint_name^}"
    assert data["description"] == "Test description"
    assert data["id"] == ${endpoint_name}_id


def test_read_${endpoint_name}s():
    response = client.get("/${endpoint_name}s/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_update_${endpoint_name}():
    # First create a ${endpoint_name}
    response = client.post(
        "/${endpoint_name}s/",
        json={"name": "Test ${endpoint_name^}", "description": "Test description"},
    )
    data = response.json()
    ${endpoint_name}_id = data["id"]

    # Then update it
    response = client.put(
        f"/${endpoint_name}s/{${endpoint_name}_id}",
        json={"name": "Updated ${endpoint_name^}", "description": "Updated description"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated ${endpoint_name^}"
    assert data["description"] == "Updated description"
    assert data["id"] == ${endpoint_name}_id


def test_delete_${endpoint_name}():
    # First create a ${endpoint_name}
    response = client.post(
        "/${endpoint_name}s/",
        json={"name": "Test ${endpoint_name^}", "description": "Test description"},
    )
    data = response.json()
    ${endpoint_name}_id = data["id"]

    # Then delete it
    response = client.delete(f"/${endpoint_name}s/{${endpoint_name}_id}")
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(f"/${endpoint_name}s/{${endpoint_name}_id}")
    assert response.status_code == 404
EOF

  # Update main.py to include the new router
  echo "Updating main.py to include the new router..."

  # Check if the router import already exists
  if ! grep -q "from app.routers import ${endpoint_name}" app/main.py; then
    # Find the last import line and add our import after it
    sed -i.bak '/^from app\.routers import/a from app.routers import '"${endpoint_name}" app/main.py
    rm -f app/main.py.bak
  fi

  # Check if the router inclusion already exists
  if ! grep -q "app.include_router(${endpoint_name}.router)" app/main.py; then
    # Find the last include_router line and add our include after it
    sed -i.bak '/^app\.include_router/a app.include_router('"${endpoint_name}"'.router)' app/main.py
    rm -f app/main.py.bak
  fi

  cd ..

  echo -e "${GREEN}✓ API endpoint $endpoint_name created successfully${NC}"
  echo -e "${CYAN}Endpoint files created in backend/app/{routers,schemas,crud,models}/${endpoint_name}.py${NC}"
}

# Print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Development Script${NC}"
  echo -e "Usage: $0 <command> [options]"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  setup              Setup development environment"
  echo -e "  backend            Start backend development server"
  echo -e "  frontend           Start frontend development server"
  echo -e "  dev                Start both backend and frontend servers"
  echo -e "  api-docs           Generate API documentation"
  echo -e "  create-component   Create a new frontend component"
  echo -e "  create-endpoint    Create a new API endpoint"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 setup                   Setup development environment"
  echo -e "  $0 dev                     Start development servers"
  echo -e "  $0 create-component Button Create a new Button component"
  echo -e "  $0 create-endpoint task    Create a new task API endpoint"
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
    setup)
      setup_dev_env
      ;;
    backend)
      start_backend
      ;;
    frontend)
      start_frontend
      ;;
    dev)
      start_dev
      ;;
    api-docs)
      generate_api_docs
      ;;
    create-component)
      if [ $# -eq 0 ]; then
        echo -e "${RED}Error: Component name is required${NC}"
        echo "Usage: $0 create-component ComponentName"
        exit 1
      fi
      create_component "$1"
      ;;
    create-endpoint)
      if [ $# -eq 0 ]; then
        echo -e "${RED}Error: Endpoint name is required${NC}"
        echo "Usage: $0 create-endpoint endpoint_name"
        exit 1
      fi
      create_endpoint "$1"
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
