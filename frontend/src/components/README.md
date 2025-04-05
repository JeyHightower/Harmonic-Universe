# Components Directory Structure

This directory contains all the React components used in the Harmonic Universe application. The components are organized by feature or domain to make them easy to find and maintain.

## Directory Structure

```
components/
├── auth/             # Authentication components (login, signup, etc.)
├── character/        # Character-related components
├── common/           # Common/reusable UI components
├── componentUtils/   # Utility functions for components
├── error/            # Error handling components
├── harmony/          # Musical harmony components
├── icons/            # Icon components and helpers
├── layout/           # Layout components (header, footer, etc.)
├── modals/           # Modal components and modal system
├── music/            # Music-related components
├── navigation/       # Navigation components
├── note/             # Note-related components
├── physics/          # Physics simulation components
├── routing/          # Routing-related components
├── settings/         # Settings-related components
├── theme/            # Theme components
└── universe/         # Universe-related components
```

## Component Organization

Components should be organized by feature or domain. Each feature directory typically contains:

- Main feature component
- Subcomponents specific to that feature
- An `index.js` file that exports the components

## Naming Conventions

- Component files should use PascalCase (e.g., `UniverseCard.jsx`)
- Component directories should use camelCase (e.g., `universe/`)
- CSS files should match the component name (e.g., `UniverseCard.css`)

## Style Guidelines

- CSS should be kept in a separate file with the same name as the component
- Component-specific styles should live in the same directory as the component
- Global styles should be placed in `src/styles/`

## Component Exports

Components should be exported using named exports in their respective files, and then re-exported through the feature directory's `index.js` file.

Example:

```javascript
// universe/index.js
export { default as UniverseCard } from "./UniverseCard";
export { default as UniverseList } from "./UniverseList";
```

This allows for clean imports:

```javascript
import { UniverseCard, UniverseList } from "../components/universe";
```

## Code Organization Within Components

Components should follow these guidelines:

1. Import statements
2. PropTypes (if using)
3. Component function
4. Helper functions (if needed)
5. Export statement

Example:

```jsx
import React from "react";
import PropTypes from "prop-types";
import "./ComponentName.css";

const ComponentName = ({ prop1, prop2 }) => {
  // Component logic
  return <div className="component-name">{/* Component JSX */}</div>;
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default ComponentName;
```
