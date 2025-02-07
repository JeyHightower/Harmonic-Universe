# Backend Directory Structure

The backend of Harmonic Universe follows a modular, domain-driven design pattern. Below is the complete directory structure with explanations for each component.

## Directory Tree

```
backend/
├── app/                      # Main application package
│   ├── api/                 # API endpoints
│   │   └── v1/
│   │       └── endpoints/   # API route handlers
│   │           └── physics/ # Physics-related endpoints
│   ├── background/          # Background tasks and workers
│   ├── core/               # Core functionality
│   │   ├── config/        # Application configuration
│   │   └── physics/       # Physics engine core
│   ├── crud/               # Database CRUD operations
│   ├── db/                 # Database configuration and sessions
│   ├── middleware/         # Custom middleware components
│   ├── models/            # SQLAlchemy models
│   │   ├── ai/           # AI-related models
│   │   ├── audio/        # Audio processing models
│   │   ├── core/         # Core data models
│   │   ├── export/       # Export functionality models
│   │   ├── organization/ # Organization models
│   │   ├── physics/      # Physics simulation models
│   │   └── visualization/# Visualization models
│   ├── schemas/           # Pydantic schemas for validation
│   ├── services/         # Business logic services
│   ├── utils/           # Utility functions
│   ├── websocket/       # WebSocket handling
│   └── main.py         # Application entry point
├── migrations/          # Alembic database migrations
├── reports/            # Test and coverage reports
├── scripts/            # Utility scripts
│   ├── analyze_errors.py
│   ├── apply_fixes.py
│   ├── cleanup.py
│   ├── db_ops.py
│   ├── fix_tests.py
│   ├── init_db.py
│   ├── run_tests.sh
│   ├── update_uuid_types.py
│   └── verify_db.py
├── .env               # Environment variables
├── .env.example      # Example environment configuration
├── .gitignore       # Git ignore rules
├── Dockerfile       # Development Docker configuration
├── Dockerfile.prod  # Production Docker configuration
├── README.md       # Project documentation
├── alembic.ini    # Alembic migration configuration
├── pytest.ini    # PyTest configuration
├── requirements.txt        # Main dependencies
└── requirements-test.txt  # Test dependencies
```

## Key Components

### Application Core (app/)

- **api/**: REST API endpoints organized by version and domain
- **background/**: Asynchronous task processing and background jobs
- **core/**: Essential application functionality and configurations
- **crud/**: Database operations following the Repository pattern
- **models/**: SQLAlchemy models organized by domain
- **schemas/**: Pydantic models for request/response validation
- **services/**: Business logic implementation
- **websocket/**: Real-time communication handling

### Configuration

- **.env**: Environment-specific configuration
- **alembic.ini**: Database migration settings
- **pytest.ini**: Testing configuration
- **Dockerfile(s)**: Container configurations for different environments

### Development Tools

- **scripts/**: Maintenance and utility scripts
- **migrations/**: Database version control
- **reports/**: Test coverage and analysis reports

## Architecture Decisions

1. **Domain-Driven Design**

   - Organized by business domains (physics, audio, ai, etc.)
   - Clear separation of concerns
   - Modular and maintainable structure

2. **API Versioning**

   - Versioned API structure (v1)
   - Future-proof for API evolution
   - Backward compatibility support

3. **Clean Architecture**

   - Separation of business logic (services)
   - Data access abstraction (crud)
   - Clear dependency flow

4. **Configuration Management**
   - Environment-based configuration
   - Secure credential handling
   - Flexible deployment options

## File Purposes

### Core Files

- **main.py**: Application entry point and FastAPI setup
- **alembic.ini**: Database migration configuration
- **requirements.txt**: Project dependencies

### Docker Files

- **Dockerfile**: Development environment configuration
- **Dockerfile.prod**: Production-optimized configuration

### Configuration Files

- **.env**: Runtime configuration and secrets
- **pytest.ini**: Test suite configuration
- **.gitignore**: Version control exclusions

## Best Practices

1. **Modularity**

   - Each module has a single responsibility
   - Clear interfaces between components
   - Minimal coupling between domains

2. **Scalability**

   - Versioned API design
   - Modular service architecture
   - Background task support

3. **Maintainability**

   - Consistent code organization
   - Comprehensive documentation
   - Automated testing support

4. **Security**
   - Environment-based secrets
   - Proper credential management
   - Secure default configurations
