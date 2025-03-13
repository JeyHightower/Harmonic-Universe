#!/bin/bash

# Frontend module setup
setup_frontend_modules() {
    cd frontend/src

    # Create index files for each module to define public interfaces
    echo "Setting up frontend module boundaries..."

    # Features module
    for feature in components/features/*; do
        if [ -d "$feature" ]; then
            feature_name=$(basename "$feature")
            cat > "$feature/index.ts" << EOL
// Public interface for ${feature_name} feature
export * from './ui';
export * from './logic';
export * from './types';
EOL
        fi
    done

    # Common components module
    cat > components/common/index.ts << EOL
// Public interface for common components
export * from './ui';
export * from './logic';
EOL

    # Layout module
    cat > components/layout/index.ts << EOL
// Public interface for layout components
export * from './ui';
EOL

    # Services module
    cat > services/index.ts << EOL
// Public interface for services
export * from './api';
export * from './websocket';
export * from './auth';
EOL

    # Store module
    cat > store/index.ts << EOL
// Public interface for store
export * from './actions';
export * from './reducers';
export * from './selectors';
export * from './types';
EOL

    cd ../..
}

# Backend module setup
setup_backend_modules() {
    cd backend/src

    # Create __init__.py files for each module to define public interfaces
    echo "Setting up backend module boundaries..."

    # API module
    cat > api/__init__.py << EOL
"""Public interface for API module."""
from .routes import *
from .controllers import *
from .middleware import *

__all__ = []  # Add your public exports here
EOL

    # Core module
    cat > core/__init__.py << EOL
"""Public interface for core business logic."""
from .universe import *
from .physics import *
from .audio import *
from .scene import *

__all__ = []  # Add your public exports here
EOL

    # Models module
    cat > models/__init__.py << EOL
"""Public interface for data models."""
from .base import *

__all__ = []  # Add your public exports here
EOL

    # Services module
    cat > services/__init__.py << EOL
"""Public interface for services."""
from .auth import *
from .websocket import *

__all__ = []  # Add your public exports here
EOL

    cd ../..
}

# Create module documentation
create_module_docs() {
    echo "Creating module documentation..."

    mkdir -p docs/architecture

    # Create module boundary documentation
    cat > docs/architecture/module-boundaries.md << EOL
# Module Boundaries and Interfaces

## Frontend Modules

### Features
- Each feature is self-contained
- Exports only through public interface (index.ts)
- No direct imports between features

### Common Components
- Reusable UI components
- No business logic
- No feature-specific code

### Layout
- Page layout components
- No business logic
- No feature-specific code

### Services
- API communication
- WebSocket handling
- Authentication

### Store
- State management
- Actions and reducers
- Selectors for data access

## Backend Modules

### API
- Routes
- Controllers
- Middleware
- No direct database access

### Core
- Business logic
- Domain models
- No HTTP/API concerns

### Models
- Database models
- Data validation
- No business logic

### Services
- External service integration
- Cross-cutting concerns
- Authentication/Authorization
EOL
}

# Main execution
echo "Setting up module boundaries..."
setup_frontend_modules
setup_backend_modules
create_module_docs
echo "Module setup complete!"
