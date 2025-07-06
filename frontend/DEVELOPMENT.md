# Frontend Development Guide

This document provides guidelines and best practices for developing the Harmonic Universe frontend.

## Development Standards

### Code Quality

1. **ESLint & Prettier**: All code must pass ESLint checks. Run `pnpm run lint` before committing.
2. **TypeScript**: Use proper typing for all components and functions.
3. **Testing**: Write tests for critical components and business logic.
4. **Documentation**: Document complex components with JSDoc comments.

### Component Design Principles

1. **Single Responsibility**: Each component should do one thing and do it well.
2. **Composition over Inheritance**: Prefer component composition over inheritance.
3. **Container/Presentation Pattern**: Separate data fetching from presentation.
4. **Reusability**: Design components to be reusable where possible.

## Feature Development Workflow

### Adding a New Feature

1. Create a new branch: `feature/feature-name`
2. Create a directory in `src/features` following the standard structure
3. Implement the feature
4. Add route(s) in the router configuration
5. Add Redux slices if needed
6. Create tests
7. Submit a pull request

### Implementing a Feature

1. Start with the data model
2. Implement API services
3. Create Redux slices
4. Build UI components
5. Connect components to state
6. Add routing
7. Implement validation and error handling
8. Add tests

## State Management

### Redux Guidelines

1. **Store Structure**:

   ```
   {
     universes: { ... },
     scenes: { ... },
     characters: { ... },
     auth: { ... },
     ui: { ... }
   }
   ```

2. **Action Naming**: Use the format `domain/eventName` (e.g., `scenes/sceneAdded`)
3. **Slice Pattern**: Organize Redux code using the slice pattern from Redux Toolkit
4. **Selectors**: Use selectors for accessing state to ensure encapsulation
5. **Immutability**: Ensure state updates are immutable (Redux Toolkit handles this)

### Local State

1. Use React's `useState` for component-specific state
2. Use `useReducer` for complex local state
3. Lift state up only when necessary

## Performance Optimization

### Rendering Optimization

1. Use React.memo for pure functional components
2. Implement shouldComponentUpdate or React.PureComponent for class components
3. Use the useCallback hook for event handlers passed to child components
4. Use the useMemo hook for expensive calculations

### Code Splitting

1. Use dynamic imports for routes
2. Lazy load large components
3. Use Suspense for handling loading states

### Bundle Optimization

1. Import only what you need from libraries
2. Use the bundle analyzer to identify large dependencies
3. Consider alternatives for large libraries

## UI/UX Guidelines

### Accessibility

1. Use semantic HTML elements
2. Ensure proper keyboard navigation
3. Add ARIA attributes where necessary
4. Maintain sufficient color contrast
5. Test with screen readers

### Responsive Design

1. Use relative units (%, em, rem) instead of pixels
2. Implement mobile-first designs
3. Use CSS Grid and Flexbox for layouts
4. Test on multiple devices and screen sizes

### Error Handling

1. Display user-friendly error messages
2. Provide guidance on how to recover from errors
3. Log errors for debugging
4. Implement error boundaries to prevent app crashes

## Testing

### Unit Testing

1. Test individual components in isolation
2. Use Jest and React Testing Library
3. Mock external dependencies
4. Test different component states

### Integration Testing

1. Test component interactions
2. Verify data flow between components
3. Test form submissions
4. Verify state updates

### End-to-End Testing

1. Use Cypress for E2E tests
2. Test critical user flows
3. Verify API interactions
4. Test in multiple browsers

## Deployment

### Build Process

1. Run `pnpm run build` to create a production build
2. Verify that the build is successful
3. Test the production build locally

### Continuous Integration

1. CI pipeline runs on every pull request
2. Ensures code quality standards are met
3. Runs the test suite
4. Creates a preview deployment
