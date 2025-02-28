# Harmonic Universe

![Harmonic Universe Logo](frontend/public/logo.png)

## Overview

Harmonic Universe is a comprehensive platform for universe management, music generation, and real-time collaboration. It features a robust physics engine, audio processing capabilities, and extensive security features.

## Essential Scripts

- **setup_database.sh**: Sets up the database tables and initializes the database.
- **test_all_feats_cruds_complete.sh**: Runs comprehensive tests for all features and CRUD operations.
- **run.sh**: Executes essential scripts and starts the application.

## Features

- User Authentication
- Universe Management
- Music Generation
- Physics Parameters
- Scene Management
- Real-time Collaboration
- Audio Processing
- Physics Engine
- Security Features
- Deployment and Monitoring

## Getting Started

1. Clone the repository.
2. Run `bash setup_database.sh` to set up the database.
3. Run `bash test_all_feats_cruds_complete.sh` to verify all features and CRUD operations.
4. Use `bash run.sh` to start the application.

## Documentation

- See `docs/FEATURES.md` for a detailed overview of all features.
- See `docs/FEATURES_CHECKLIST.md` for a checklist of implemented features and CRUD operations.

## Contributing

Please refer to `CONTRIBUTING.md` for guidelines on contributing to the project.

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

- Python with FastAPI
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
├── backend/                # Python FastAPI backend
│   ├── app/                # Main application
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── db/             # Database models and session
│   │   ├── models/         # Pydantic models
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
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── redux/          # Redux store, reducers, etc.
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # API service functions
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

- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/universe`: Universe operations
- `/api/physics_objects`: Physics object management
- `/api/scenes`: Scene management
- `/api/scenes/{scene_id}/physics_parameters`: Physics parameters management
- `/api/music`: Music generation and export

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Special thanks to the physics and music theory communities for inspiration
- All our open-source dependencies that made this project possible
