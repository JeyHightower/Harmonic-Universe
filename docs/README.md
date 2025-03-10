# Harmonic Universe

![Harmonic Universe Logo](frontend/public/logo.png)

## Overview

Harmonic Universe is an interactive web application that allows users to create and explore musical universes based on physics principles. This project combines music theory, physics simulation, and interactive visualization to create a unique creative tool for musicians, composers, and audio enthusiasts.

Users can:

- Create custom universes with custom physics parameters
- Add and manage physics objects with unique properties
- Generate music based on the interaction of physics objects
- Visualize the movement and interaction of objects in real-time
- Create and manage scenes for different musical compositions
- Export and share musical compositions

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Modal System](#modal-system)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### Universe Management

- Create, view, edit, and delete musical universes
- Configure global physics parameters: gravity strength, damping factors, particle behaviors
- Control visibility and sharing settings

### Physics Object Management

- Add various types of physics objects to your universe
- Configure mass, position, velocity, and other properties
- Each object contributes unique musical elements to the composition

### Physics Parameters Management

- Create and manage multiple physics parameter sets for each scene
- Configure detailed physics properties including gravity (X, Y, Z axes), time scale, air resistance
- Adjust material properties like friction and bounce factors
- Apply different parameter sets to scenes to create varied physics environments

### Scene Management

- Create scenes to capture specific configurations of physics objects
- Quickly switch between different scenes to explore variations
- Save favorite arrangements for later use

### Music Generation

- Algorithmic music generation based on physics interactions
- Real-time audio synthesis
- Export compositions as audio files
- Adjust musical parameters like scale, tempo, and instrumentation

### Visualizations

- Real-time physics simulation
- Interactive 2D visualization
- Physics-driven animations

### User System

- User accounts with personalized dashboards
- Sharing and collaboration features
- Save and load projects

## Technology Stack

### Frontend

- React.js
- Redux for state management
- React Router for navigation
- CSS Modules and custom styling
- Web Audio API for sound generation
- Canvas/WebGL for visualizations

### Backend

- Python with Flask
- SQLAlchemy ORM
- Alembic for database migrations
- PostgreSQL database
- JWT authentication
- Celery for background tasks
- Redis for caching

### DevOps

- Docker and Docker Compose support
- Testing frameworks (Pytest, Jest)
- Continuous Integration setup

## Project Structure

```
harmonic-universe/
├── backend/                # Python Flask backend
│   ├── app/                # Main application
│   │   ├── api/            # API routes
│   │   │   └── routes/     # Route definitions
│   │   ├── core/           # Core functionality
│   │   ├── db/             # Database models and session
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── scripts/        # Utility scripts
│   │   └── utils/          # Helper functions
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   │   ├── common/     # Common components
│   │   │   ├── features/   # Feature-specific components
│   │   │   └── layout/     # Layout components
│   │   ├── contexts/       # React contexts
│   │   ├── features/       # Feature modules
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Redux store, reducers, etc.
│   │   ├── routes/         # Route definitions
│   │   ├── styles/         # Global styles
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main App component
│   ├── package.json        # NPM dependencies
│   └── vite.config.js      # Vite configuration
│
├── docker/                 # Docker configuration
├── run.sh                  # Main control script
├── docs/                   # Documentation
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- PostgreSQL database (or Docker for containerized setup)
- Redis (optional, for caching and background tasks)

### Installation

The project includes a convenient control script (`run.sh`) that handles most operations. To set up the project:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe
   ```

2. Set up environment files:

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the environment variables with your specific configuration

3. Run the setup script:
   ```bash
   ./run.sh setup
   ```

This will:

- Create a Python virtual environment
- Install backend dependencies
- Set up the database
- Install frontend dependencies

### Running the Application

To start the development servers:

```bash
./run.sh dev
```

This will start both the backend and frontend servers. Alternatively, you can start them individually:

```bash
# Backend only
./run.sh dev backend

# Frontend only
./run.sh dev frontend
```

## Usage

Once the application is running, navigate to `http://localhost:3000` in your web browser. If you're a new user, you'll need to create an account. The demo setup also creates a demo user you can use to explore the application.

### Creating Your First Universe

1. Log in to your account
2. Navigate to the Dashboard
3. Click "Create Universe"
4. Name your universe and configure the basic physics parameters
5. Start adding physics objects to your universe
6. Play the simulation to hear the generated music

### Running Tests

The project includes comprehensive tests for both frontend and backend:

```bash
# Run all tests
./run.sh test all

# Run specific test suites
./run.sh test backend
./run.sh test frontend
./run.sh test api
```

### Database Operations

The control script also provides commands for database operations:

```bash
# Run migrations
./run.sh db migrate

# Reset database to initial state
./run.sh db reset

# Backup database
./run.sh db backup

# Restore from backup
./run.sh db restore
```

## API Documentation

When the backend server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

The API is organized around RESTful principles with the following main endpoints:

- `/api/v1/auth` - Authentication endpoints
- `/api/v1/users` - User management
- `/api/v1/universes` - Universe CRUD operations
- `/api/v1/scenes` - Scene management
- `/api/v1/physics-objects` - Physics object management
- `/api/v1/physics-parameters` - Physics parameters management
- `/api/v1/audio` - Audio generation and management
- `/api/v1/visualizations` - Visualization management

## Modal System

Harmonic Universe uses a standardized modal system for all user interactions that require forms or confirmations. The modal system supports:

### Modal Types

- **Form Modals**: For creating and editing entities (universes, scenes, physics objects, etc.)
- **Confirmation Modals**: For confirming destructive actions like deletion
- **Information Modals**: For displaying detailed information about entities

### Deep Linking

The modal system supports deep linking, allowing users to share links that open specific modals. For example:

- `/api/universes/create` - Opens the universe creation modal
- `/api/scenes/:id/edit` - Opens the scene edit modal for a specific scene
- `/api/physics-objects/:id/delete` - Opens a confirmation modal for deleting a physics object

### Modal Registry

All modals are registered in a central registry, making it easy to manage and update them. The registry handles:

- Modal component mapping
- Props transformation
- Modal configuration
- Deep linking support

## Troubleshooting

Harmonic Universe includes several built-in troubleshooting tools to help diagnose and resolve common issues.

### Troubleshooting Tools

1. **Web-based Troubleshooting Page**

   - Access the troubleshooting dashboard at `/troubleshoot`
   - Provides real-time information about application status, database connection, and static files
   - Includes common solutions for typical issues

2. **API Troubleshooting Endpoint**

   - `GET /api/troubleshoot` returns detailed system information in JSON format
   - Useful for programmatic monitoring and diagnostics

3. **Command-line Diagnostic Tool**
   - Run `python check_app.py` to get a comprehensive status report
   - Shows database status, migration status, and application health
   - Use `python check_app.py --verbose` for more detailed output

### Common Issues and Solutions

#### Database Migration Issues

If you encounter database migration errors (e.g., `DuplicateTable` errors):

1. Run the migration fix script:

   ```bash
   python fix_migrations.py
   ```

2. Check migration status:

   ```bash
   flask db current
   ```

3. If needed, mark migrations as applied without running them:
   ```bash
   flask db stamp head
   ```

#### Static File Serving Issues

If static files aren't being served correctly:

1. Verify the static directory exists and contains the required files
2. Check file permissions
3. Ensure the application is configured to serve static files correctly

#### Application Not Starting

If the application fails to start:

1. Check environment variables (especially `DATABASE_URL`)
2. Verify database connectivity
3. Check for errors in the application logs
4. Run the diagnostic tool: `python check_app.py`

#### Deployment Issues

For Render deployment issues:

1. Check the Render logs for specific error messages
2. Verify environment variables are set correctly in the Render dashboard
3. Ensure the build and start commands are configured properly in `render.yaml`

### Getting Help

If you're still experiencing issues after using the troubleshooting tools:

1. Check the GitHub Issues page for similar problems and solutions
2. Join our Discord community for real-time help
3. Submit a detailed bug report including the output from `python check_app.py --verbose`

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Special thanks to the physics and music theory communities for inspiration
- All our open-source dependencies that made this project possible

# Harmonic Universe Database Migration Toolkit

A set of tools and guides to solve common database migration issues for Flask/SQLAlchemy applications deployed on Render.com.

## Problem

When deploying Flask applications with SQLAlchemy on Render.com, you may encounter the error:

```
ERROR [alembic.util.messaging] Error occurred during deployment:
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateTable) relation "users" already exists
```

This toolkit provides multiple solutions to fix this issue.

## Quick Solutions

For an immediate fix, see [QUICK_REFERENCE.md](QUICK_REFERENCE.md).

## Documentation

- [RENDER_DB_MIGRATION_GUIDE.md](RENDER_DB_MIGRATION_GUIDE.md) - Complete guide to understanding and fixing the issue
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions for Render
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Concise reference for common fixes

## Tools

This toolkit includes several tools:

- **wsgi_wrapper.py** - WSGI wrapper script that fixes database state before application initialization
- **render_emergency_fix.py** - Direct database fix script for immediate fixes
- **check_migration_state.py** - Diagnostic tool to check and fix database migration state
- **render_verify.py** - Comprehensive verification script for diagnosing deployment issues

## Usage

### Option 1: WSGI Wrapper (Recommended)

1. Add `wsgi_wrapper.py` to your repository
2. Update your `render.yaml`:
   ```yaml
   services:
     - type: web
       # ...
       startCommand: gunicorn wsgi_wrapper:app
   ```
3. Commit and deploy

### Option 2: Emergency Fix

Run in your Render shell:

```bash
./render_emergency_fix.py
```

### Option 3: Database Migration State Checker

Run the migration state checker:

```bash
./check_migration_state.py --auto-fix
```

## Project Structure

```
.
├── README.md                     # Main documentation
├── RENDER_DB_MIGRATION_GUIDE.md  # Complete guide
├── DEPLOYMENT_GUIDE.md           # Deployment instructions
├── QUICK_REFERENCE.md            # Quick fixes reference
├── wsgi_wrapper.py               # WSGI wrapper script
├── render_emergency_fix.py       # Emergency fix script
├── check_migration_state.py      # Migration state checker
└── render_verify.py              # Verification script
```

## How It Works

These tools solve the issue by:

1. Creating the `alembic_version` table if it doesn't exist
2. Setting the migration version to a specific ID ('60ebacf5d282')
3. This prevents Alembic from attempting to create tables that already exist

## Custom Migration ID

If your problematic migration ID is different than the default:

```bash
./render_emergency_fix.py YOUR_MIGRATION_ID
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Demo Login Server

To enable the demo login functionality, you need to run the demo login server:

```bash
# Make the script executable (if not already)
chmod +x demo_login_server.py

# Run the demo login server
./demo_login_server.py
```

The demo login server will run on port 5001 and provide a simple JWT token for demo users.

## Running the Application

To run the main application:

```bash
# Run the Flask application
python app.py
```

The main application will run on port 10000.

## Accessing the Application

Open your browser and navigate to:

```
http://localhost:10000
```

## Demo Login

To try the demo login:

1. Make sure the demo login server is running on port 5001
2. Click the "Try Demo" button on the home page
3. You will be automatically logged in and redirected to the dashboard

## Authentication

The application uses JWT tokens for authentication. The tokens are stored in localStorage:

- `accessToken`: Used for API requests
- `refreshToken`: Used to get a new access token when it expires

## API Endpoints

The application provides the following API endpoints:

- `/api/auth/demo-login`: Demo login endpoint
- `/api/v1/auth/login`: User login endpoint
- `/api/v1/auth/register`: User registration endpoint
- `/api/v1/auth/me`: Get current user information
- `/api/v1/auth/refresh`: Refresh access token

## Troubleshooting

If you encounter issues with the demo login:

1. Check that the demo login server is running on port 5001
2. Check the browser console for error messages
3. Try clearing localStorage and refreshing the page
4. Ensure there are no CORS issues by checking the network tab in developer tools

## Authentication Routes

The application has several authentication routes:

1. **API v1 Routes** (Blueprint routes):

   - `/api/v1/auth/register` - Register a new user
   - `/api/v1/auth/login` - Login with username/email and password
   - `/api/v1/auth/refresh` - Refresh access token
   - `/api/v1/auth/me` - Get current user information
   - `/api/v1/auth/demo-login` - Login as demo user

2. **Direct API Routes**:

   - `/api/auth/demo-login` - Direct demo login endpoint

3. **Demo Login Server**:
   - `http://localhost:5001/api/auth/demo-login` - Standalone demo login server
   - `http://localhost:5001/api/v1/auth/demo-login` - Alternative path for the same endpoint
