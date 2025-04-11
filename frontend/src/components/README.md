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
├── features/         # Feature-specific components organized by domain
│   ├── auth/         # Authentication components
│   ├── character/    # Character components
│   ├── harmony/      # Musical harmony components
│   ├── music/        # Music components
│   ├── physics/      # Physics components
│   ├── scene/        # Scene components
│   └── universe/     # Universe components
├── icons/            # Icon components and helpers
├── layout/           # Layout components (header, footer, etc.)
├── modals/           # Modal components and modal system
├── music/            # Music-related components (legacy)
├── navigation/       # Navigation components
├── note/             # Note-related components
├── physics/          # Physics simulation components (legacy)
├── routing/          # Routing-related components
├── settings/         # Settings-related components
├── theme/            # Theme components
└── universe/         # Universe-related components (legacy)
```

## Component Organization

Components are being refactored to be organized under the `features/` directory by domain. Each feature directory typically contains:

- Main feature components
- Subcomponents specific to that feature
- An `index.js` file that exports the components
- A `README.md` file documenting the components

## Refactoring Status

We are in the process of refactoring our component structure to follow a more consistent pattern. The following features have been refactored:

- Music components (moved to `features/music/`)
- Harmony components (moved to `features/harmony/`)
- Universe components (moved to `features/universe/`)

Legacy directories will be removed as refactoring progresses.

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
// features/universe/index.js
export { default as UniverseCard } from "./UniverseCard";
export { default as UniverseList } from "./UniverseList";
```

This allows for clean imports:

```javascript
import { UniverseCard, UniverseList } from "../components/features/universe";
```

Alternatively, you can use the lazy-loaded components from the main index:

```javascript
import { UniverseComponents } from "../components";
const { UniverseCard, UniverseList } = UniverseComponents;
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
