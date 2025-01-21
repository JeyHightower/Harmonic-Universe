# Project Structure

## Root Directory

```
harmonic-universe/
├── frontend/           # React frontend application
├── backend/           # Flask backend application
├── docs/             # Project documentation
├── .github/          # GitHub workflows and templates
├── scripts/          # Utility scripts
├── deploy.sh         # Deployment script
├── k6.config.js      # k6 load testing configuration
├── run_tests.sh      # Test runner script
└── README.md         # Project overview
```

## Frontend Structure

```
frontend/
├── src/
│   ├── assets/        # Static assets (images, fonts)
│   ├── components/    # Reusable React components
│   ├── config/        # Configuration files
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── redux/         # Redux store and slices
│   ├── services/      # API and service integrations
│   ├── styles/        # Global styles and themes
│   └── utils/         # Utility functions
├── public/           # Public static files
├── cypress/          # End-to-end tests
└── tests/            # Unit and integration tests
```

## Backend Structure

```
backend/
├── app/
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middleware/    # Custom middleware
│   ├── physics/       # Physics engine
│   ├── sockets/       # WebSocket handlers
│   └── utils/         # Utility functions
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   ├── e2e/         # End-to-end tests
│   ├── load/        # Load tests
│   └── k6/          # k6 performance tests
├── migrations/       # Database migrations
└── config.py        # Application configuration
```

## Documentation Structure

```
docs/
├── API.md           # API documentation
├── FEATURES.md      # Feature list and status
├── SETUP.md         # Setup instructions
├── TESTING.md       # Testing documentation
├── DEPLOYMENT.md    # Deployment guide
└── CONTRIBUTING.md  # Contribution guidelines
```

## Key Files

### Frontend

- `frontend/src/main.jsx`: Application entry point
- `frontend/src/App.jsx`: Root component
- `frontend/src/redux/store.js`: Redux store configuration
- `frontend/vite.config.js`: Vite configuration
- `frontend/jest.config.js`: Jest test configuration
- `frontend/cypress.config.js`: Cypress test configuration

### Backend

- `backend/app/__init__.py`: Application factory
- `backend/app/config.py`: Configuration settings
- `backend/app/extensions.py`: Flask extensions
- `backend/app/websockets.py`: WebSocket handlers
- `backend/run.py`: Development server
- `backend/requirements.txt`: Python dependencies

### Configuration

- `.env`: Environment variables
- `.gitignore`: Git ignore patterns
- `package.json`: Node.js dependencies
- `deploy.sh`: Deployment configuration

## Development Workflow

### Frontend Development

1. Components are organized by feature in `src/components`
2. Pages are in `src/pages`
3. State management uses Redux with slices in `src/redux/slices`
4. API calls are centralized in `src/services`
5. Styles use CSS modules and global styles

### Backend Development

1. Routes are defined in `app/routes`
2. Models are in `app/models`
3. Business logic is in `app/services`
4. WebSocket handlers in `app/sockets`
5. Database migrations in `migrations`

### Testing Strategy

1. Unit tests alongside source code
2. Integration tests in dedicated directories
3. End-to-end tests using Cypress
4. Load testing with k6
5. Continuous testing in CI/CD pipeline

### Deployment Process

1. Frontend built with Vite
2. Backend containerized with Docker
3. Deployed to render.com
4. Automated via GitHub Actions
5. Environment-specific configurations
