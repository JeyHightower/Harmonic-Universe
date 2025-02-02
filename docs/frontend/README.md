# Harmonic Universe

A modern web application for music collaboration and creation.

## Project Structure

```
.
├── backend/           # FastAPI backend service
├── frontend/         # React frontend application
└── root/             # Project-level configuration and documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Set up the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:

```bash
cd frontend
npm install
```

4. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development

1. Start the backend server:

```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

## Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Documentation](docs/api.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# Frontend Documentation

## Overview

The frontend is built using React with TypeScript, providing a modern and responsive user interface for the Harmonic Universe application.

## Project Structure

```
frontend/src/
├── assets/         # Static assets (images, fonts, etc.)
├── components/     # React components
│   └── shared/     # Reusable components
├── contexts/       # React context providers
├── engine/         # Game/visualization engine logic
├── features/       # Feature modules (auth, profile, etc.)
├── hooks/          # Custom React hooks
│   └── shared/     # Reusable hooks
├── layouts/        # Page layout components
├── models/         # TypeORM entities and DTOs
├── pages/          # Page components
├── repositories/   # Data access layer
├── routes/         # Routing configuration
├── services/       # Business logic and API services
├── store/          # Redux store configuration
│   ├── slices/     # Redux slices
│   └── middleware/ # Redux middleware
├── styles/         # Global styles and theme
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

Key Files:
├── App.tsx        # Root component
├── main.tsx       # Application entry point
└── config.ts      # Application configuration
```

## Directory Purposes

### Core Application

- `App.tsx`: Root component that sets up providers and routing
- `main.tsx`: Entry point that renders the root component
- `config.ts`: Global configuration variables

### Components and UI

- `components/`: Reusable React components
- `layouts/`: Page layout templates
- `pages/`: Full page components
- `features/`: Feature-specific modules

### State Management

- `store/`: Redux store configuration and slices
- `contexts/`: React Context providers
- `models/`: Data models and TypeORM entities

### Data and Logic

- `repositories/`: Data access layer (API calls)
- `services/`: Business logic layer
- `engine/`: Game and visualization logic

### Styling

- `styles/`: Global styles, theme, and CSS modules
- `assets/`: Static files like images and fonts

### Utilities

- `hooks/`: Custom React hooks
- `utils/`: Helper functions and utilities
- `types/`: TypeScript type definitions

## Development Guidelines

### Component Organization

- Place reusable components in `components/shared/`
- Feature-specific components go in their feature directory
- Page components go in `pages/`

### State Management

- Use Redux for global state
- Use Context for theme/auth state
- Use local state for component-specific state

### Styling

- Use CSS modules for component styles
- Global styles go in `styles/`
- Follow theme definitions for consistency

### Data Handling

- Use repositories for API calls
- Use services for business logic
- Keep data transformation in services

### Type Safety

- Define interfaces in `types/`
- Use TypeScript strictly
- Document complex types

## Testing

### Unit Tests

```bash
yarn test
```

### E2E Tests

```bash
yarn cypress:open  # Interactive mode
yarn cypress:run   # Headless mode
```

## Building

```bash
yarn build
```

The build output will be in the `dist/` directory.

## Best Practices

1. Follow the established directory structure
2. Use TypeScript strictly
3. Write tests for critical components
4. Document complex logic
5. Follow the styling guide
6. Use proper error boundaries
7. Implement proper loading states
8. Handle errors gracefully

## Performance

- Use React.memo for expensive components
- Implement code splitting
- Optimize bundle size
- Use proper caching strategies
- Monitor performance metrics

For more detailed documentation, see:

- [Component Documentation](./components.md)
- [API Documentation](./api.md)
- [State Management](./state.md)
