# Standardized Feature Directory Structure

## Directory Structure

Each feature directory should follow this standard structure:

```
feature-name/
├── components/              # Smaller component pieces specific to this feature
│   ├── ComponentOne.jsx     # Individual component files
│   ├── ComponentTwo.jsx
│   └── ...
├── modals/                  # Modal components for this feature
│   ├── FeatureModal.jsx     # Main modal component
│   ├── FeatureInfoModal.jsx # Info/details modal
│   └── ...
├── pages/                   # Full page components
│   ├── FeatureListPage.jsx  # List page
│   ├── FeatureDetailPage.jsx # Detail page
│   └── ...
├── hooks/                   # Feature-specific hooks
│   ├── useFeature.js        # Main feature hook
│   └── ...
├── utils/                   # Feature-specific utilities
│   ├── featureUtils.js      # Utility functions
│   └── ...
├── styles/                  # CSS modules or styled components
│   ├── Feature.module.css   # Main stylesheet
│   └── ...
├── types/                   # TypeScript types (if applicable)
│   ├── feature.types.ts     # Type definitions
│   └── ...
├── index.js                 # Exports all components
└── README.md                # Documentation
```

## Component Naming Conventions

1. All component files should be named using PascalCase
2. CSS modules should be named after their component with .module.css extension
3. Utility files should use camelCase
4. Index files should be lowercase

## Export Patterns

Each feature's index.js should:

1. Export all components directly for ease of import
2. Include backward compatibility exports if needed
3. Have a descriptive comment header

Example:

```js
/**
 * Feature Components
 * 
 * This file exports all feature-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Component exports
export { default as FeatureComponent } from './components/FeatureComponent';

// Modal exports
export { default as FeatureModal } from './modals/FeatureModal';

// Page exports
export { default as FeatureListPage } from './pages/FeatureListPage';

// For backward compatibility
export { default as OldComponentName } from './components/NewComponentName';
```

## Import Patterns

Components should be imported consistently throughout the application:

```js
// Import specific components
import { FeatureModal, FeatureComponent } from '../components/features/feature-name';

// OR for lazy-loaded components
import { FeatureComponents } from '../components';
const { FeatureModal, FeatureComponent } = FeatureComponents;
```

## CSS Approach

Use one of the following consistent approaches across all features:

1. CSS Modules (preferred): `FeatureComponent.module.css`
2. Styled Components: Component styles defined in the same file
3. Global CSS with namespacing: `Feature.css` with prefixed classes

## Documentation

Each feature directory should include a README.md with:

1. Purpose of the feature
2. List of components and their purpose
3. Usage examples
4. Dependencies on other features
5. API documentation if applicable 