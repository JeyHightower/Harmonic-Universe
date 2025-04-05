# Styles Directory

This directory contains global CSS styles for the Harmonic Universe application. Component-specific styles are located alongside their respective components.

## Directory Structure

```
styles/
├── App.css                # Application-wide styles
├── Button.css             # Button component styles
├── common.css             # Common shared styles
├── global.css             # Global styles and CSS variables
├── index.css              # Main CSS entry point
├── reset.css              # CSS reset/normalize
├── theme.css              # Theme variables and styles
├── variables.css          # CSS custom properties (variables)
└── [component].css        # Component-specific global styles
```

## CSS Organization

The CSS in this application follows these principles:

### Global Styles

- `reset.css`: Normalizes browser styles
- `variables.css`: Defines global CSS custom properties
- `global.css`: Sets global styles for HTML elements
- `theme.css`: Defines theme-related styles and variables
- `common.css`: Shared utility classes

### Component-Specific Styles

- Each component should have its own CSS file
- Component-specific CSS files should be located next to the component file
- Global component styles may be placed in this directory

## CSS Naming Conventions

This project uses a modified BEM (Block, Element, Modifier) naming convention:

- **Block**: Main component (e.g., `.button`)
- **Element**: Part of a component (e.g., `.button__icon`)
- **Modifier**: Variant of a component (e.g., `.button--primary`)

Example:

```css
.card {
  /* Base card styles */
}

.card__title {
  /* Card title styles */
}

.card__content {
  /* Card content styles */
}

.card--featured {
  /* Featured card variant */
}
```

## CSS Variables

CSS variables are defined in `variables.css` and are organized by:

- Colors
- Typography
- Spacing
- Breakpoints
- Animation
- Shadows

Example:

```css
:root {
  /* Colors */
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --color-text: #333333;
  --color-background: #ffffff;

  /* Typography */
  --font-family-base: "Roboto", sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

## Theming

The application supports light and dark themes using CSS variables and the `data-theme` attribute on the root element. Theme-specific variables are defined in `theme.css`.

Example theme usage:

```css
:root {
  /* Default light theme */
  --bg-color: #ffffff;
  --text-color: #333333;
}

[data-theme="dark"] {
  --bg-color: #121212;
  --text-color: #f1f1f1;
}
```

## Media Queries

Media queries are used for responsive design. Common breakpoints are defined as CSS variables in `variables.css`.

Example media query:

```css
@media (max-width: var(--breakpoint-md)) {
  .container {
    padding: var(--spacing-sm);
  }
}
```

## Best Practices

1. **Component Isolation**: Component styles should not affect other components
2. **Reusable Utilities**: Common utility classes should be defined in `common.css`
3. **CSS Variables**: Use CSS variables for consistent theming and styling
4. **Mobile First**: Design for mobile first, then enhance for larger screens
5. **Minimal Specificity**: Keep selector specificity as low as possible
6. **Avoid !important**: Only use as a last resort
7. **Comment Complex Code**: Add comments to explain complex selectors or properties
