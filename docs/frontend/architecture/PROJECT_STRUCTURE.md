# Project Structure

## Overview

This document outlines the organization of the Harmonic Universe codebase.

## Root Directory

```
harmonic-universe/
├── backend/           # Flask backend application
├── frontend/          # React frontend application
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── tests/            # Global test files
└── .github/          # GitHub workflows and templates
```

## Backend Structure

```
backend/
├── app/
│   ├── models/           # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── universe.py
│   │   ├── physics_parameters.py
│   │   ├── music_parameters.py
│   │   ├── audio_parameters.py
│   │   ├── visualization_parameters.py
│   │   ├── template.py
│   │   ├── comment.py
│   │   ├── favorite.py
│   │   ├── notification.py
│   │   ├── storyboard.py
│   │   ├── user_preferences.py
│   │   ├── analytics.py
│   │   └── base.py
│   ├── routes/          # API endpoints
│   │   ├── auth.py
│   │   ├── universes.py
│   │   ├── parameters.py
│   │   ├── templates.py
│   │   ├── users.py
│   │   └── ai.py
│   ├── services/        # Business logic
│   │   ├── physics.py
│   │   ├── music.py
│   │   ├── audio.py
│   │   ├── visualization.py
│   │   ├── ai.py
│   │   └── websocket.py
│   └── websocket/       # WebSocket handlers
│       ├── events.py
│       ├── manager.py
│       └── rooms.py
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
├── migrations/         # Database migrations
└── config/            # Configuration files
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── universe/
│   │   ├── parameters/
│   │   ├── visualization/
│   │   └── common/
│   ├── pages/         # Page components
│   │   ├── Home/
│   │   ├── Universe/
│   │   ├── Profile/
│   │   └── Settings/
│   ├── services/      # API clients
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   └── auth.ts
│   ├── store/         # Redux store
│   │   ├── slices/
│   │   └── middleware/
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   └── styles/        # Global styles
├── public/           # Static assets
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── config/          # Build configuration
```

## Documentation Structure

```
docs/
├── api/             # API documentation
│   ├── endpoints/
│   ├── models/
│   └── websocket/
├── features/        # Feature specifications
├── monitoring/      # Monitoring setup
├── pwa/            # Progressive Web App
├── testing/        # Test documentation
└── *.md            # Core documentation
```

## Scripts

```
scripts/
├── setup.sh        # Project setup
├── deploy.sh       # Deployment
├── test_runner.sh  # Test execution
└── cleanup.sh      # Codebase cleanup
```

## Configuration Files

```
./
├── .env                # Environment variables
├── .gitignore         # Git ignore rules
├── package.json       # Node.js dependencies
├── requirements.txt   # Python dependencies
├── tsconfig.json     # TypeScript config
└── vite.config.js    # Vite build config
```

## Key Files

### Backend

- `app/__init__.py`: Application factory
- `app/models/base.py`: Base model class
- `app/routes/__init__.py`: Route registration
- `app/services/__init__.py`: Service initialization
- `config.py`: Configuration classes

### Frontend

- `src/App.tsx`: Root component
- `src/main.tsx`: Application entry
- `src/store/index.ts`: Redux store setup
- `src/styles/global.css`: Global styles
- `index.html`: HTML template

## Development Workflow

1. **Backend Development**

   ```bash
   cd backend
   flask run
   ```

2. **Frontend Development**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Testing**

   ```bash
   ./run_all_tests.sh
   ```

4. **Documentation**
   ```bash
   # Generate API docs
   cd docs/api
   npm run generate
   ```

## Best Practices

1. **File Organization**

   - Keep related files together
   - Use consistent naming conventions
   - Maintain clear separation of concerns

2. **Code Style**

   - Follow language-specific style guides
   - Use consistent formatting
   - Write clear documentation

3. **Testing**

   - Write tests for new features
   - Maintain test coverage
   - Use appropriate test types

4. **Documentation**
   - Keep docs up to date
   - Document complex logic
   - Include examples

Last updated: Thu Jan 30 18:37:47 CST 2025
