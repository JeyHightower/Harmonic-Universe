# Harmonic Universe Frontend

This directory contains the React frontend application for the Harmonic Universe project.

## Technology Stack

- **Framework**: React 18
- **State Management**: Redux + Redux Toolkit
- **Styling**: CSS Modules + Material UI
- **Routing**: React Router v6
- **API Communication**: Axios
- **3D Rendering**: Three.js
- **Audio Processing**: Tone.js

## Directory Structure

```
frontend/
├── public/            # Static assets served directly
├── src/               # Source code
│   ├── components/    # Reusable UI components
│   │   ├── character/ # Character management feature
│   │   ├── harmony/   # Harmony feature
│   │   ├── music/     # Music editing feature
│   │   ├── note/      # Note management feature
│   │   ├── physics/   # Physics simulation feature
│   │   ├── scene/     # Scene management feature
│   │   └── universe/  # Universe management feature
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # Redux store configuration
│   ├── styles/        # Global styles
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Application root component
│   └── index.jsx      # Entry point
├── tests/             # Test files
├── .eslintrc.js       # ESLint configuration
├── package.json       # Dependencies and scripts
└── vite.config.js     # Vite configuration
```

## Feature Structure Standard

Each feature directory follows a standard structure:

```
feature-name/
├── components/   # Feature-specific components
├── modals/       # Modal components
├── pages/        # Page components
├── hooks/        # Feature-specific hooks
├── utils/        # Feature-specific utilities
├── styles/       # CSS modules
└── index.js      # Exports all components
```

## Development Workflow

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. Install dependencies:

```bash
npm install
# or if using pnpm
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### Running the Application

```bash
npm run dev
# or
pnpm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```bash
npm run build
# or
pnpm run build
```

The built files will be in the `dist` directory.

## Code Conventions

### Component Guidelines

1. Use functional components with hooks
2. Group related components in subdirectories
3. Use named exports for components
4. Follow the feature-first organization pattern

### State Management

1. Use Redux for global state
2. Use React state for local component state
3. Use Redux Toolkit for Redux best practices
4. Create selectors for data access

### Styling Approach

1. Use CSS Modules for component-specific styles
2. Use Material UI for standard components
3. Use global variables for colors and typography

## Performance Considerations

1. Implement code splitting with React.lazy and Suspense
2. Optimize Three.js rendering
3. Memoize expensive computations with useMemo
4. Prevent unnecessary renders with React.memo

## Connecting to the Backend

API services are located in `src/services/` and handle all communication with the backend API. 

Example usage:

```javascript
import { getScenes } from '../services/api';

// In a component
const fetchData = async () => {
  try {
    const scenes = await getScenes();
    // Use the data
  } catch (error) {
    // Handle error
  }
};
``` 