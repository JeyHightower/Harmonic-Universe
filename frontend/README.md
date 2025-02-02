# Harmonic Universe Frontend

A modern React application built with TypeScript, Material-UI, and Redux Toolkit.

## Project Structure

```
src/
├── assets/          # Static assets like images and icons
│   ├── images/
│   └── icons/
├── components/      # Reusable components
│   ├── common/      # Shared components like buttons, inputs
│   ├── layout/      # Layout components like header, footer
│   └── forms/       # Form-related components
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   └── home/        # Home page
├── store/           # Redux store configuration
│   ├── slices/      # Redux slices
│   └── middleware/  # Redux middleware
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   └── helpers/     # Helper functions
├── services/        # API services
│   └── api/         # API related functions
├── hooks/           # Custom React hooks
├── contexts/        # React contexts
└── features/        # Feature-based modules
    ├── user/        # User-related features
    └── settings/    # Settings-related features
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Technologies Used

- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- React Router
- Vite
- ESLint
- Prettier
- Vitest
- Cypress

## Development Guidelines

1. Follow the established directory structure
2. Use TypeScript for all new files
3. Follow ESLint and Prettier configurations
4. Write tests for new features
5. Use Material-UI components for consistency
6. Follow Redux best practices for state management
