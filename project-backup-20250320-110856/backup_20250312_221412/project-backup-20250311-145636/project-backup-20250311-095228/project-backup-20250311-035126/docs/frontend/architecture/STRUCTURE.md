# Project Structure Documentation

## Frontend Structure
```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── common/     # Shared components
│   │   ├── layout/     # Layout components
│   │   └── features/   # Feature-specific components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── services/       # API services
│   ├── assets/         # Static assets
│   ├── styles/         # Global styles
│   ├── config/         # Configuration files
│   ├── contexts/       # React contexts
│   └── store/          # State management
```

## Backend Structure
```
backend/
├── app/
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration
│   ├── schemas/        # Data schemas
│   └── validators/     # Input validators
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
```

Last updated: Thu Jan 30 18:37:47 CST 2025
