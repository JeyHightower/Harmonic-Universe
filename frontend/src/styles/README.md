# CSS Architecture - Harmonic Universe

This document outlines the CSS architecture for the Harmonic Universe frontend project, following the refactoring to eliminate conflicts and improve maintainability.

## CSS File Structure

CSS files are organized in a specific order of importance:

1. **reset.css** - Resets browser defaults to ensure consistent styling
2. **variables.css** - Defines CSS variables used throughout the application
3. **theme.css** - Defines theme-specific variables and color palettes
4. **global.css** - Global styles applied throughout the application
5. **common.css** - Common component styles (loading states, empty states, forms)
6. **buttons.css** - Consolidated button styles
7. **modal.css** - Consolidated modal styles
8. **index.css** - Additional global styles
9. **App.css** - Application-specific styles
10. **[component].css** - Component-specific styles

## Import Order

CSS files are imported in the above order in `main.jsx` to ensure proper cascading of styles. This order allows more specific styles to override more general ones when needed.

## Consolidated Files

Several consolidated files have been created to eliminate conflicts:

- **common.css** - Contains common components like loading states, spinners, empty states, and form elements
- **buttons.css** - All button styles, replacing multiple button implementations
- **modal.css** - All modal styles, replacing multiple modal implementations

## Best Practices

To avoid future conflicts, follow these guidelines:

### 1. Use the Established Component Classes

- For buttons, use `.button` and `.button-*` classes (not `.btn`)
- For modals, use the classes defined in `modal.css`
- For loading states, use `.loading-container` and `.spinner` from `common.css`
- For forms, use the form components from `common.css`

### 2. Component-specific CSS

- Component-specific styles should be placed in their own CSS file
- Use component-specific class names to avoid conflicts (e.g., `.user-profile-header` instead of `.header`)
- Import component CSS in the component file, not in `main.jsx`

### 3. CSS Variables

- Use CSS variables from `variables.css` and `theme.css` for consistency
- Don't redefine variables in component CSS files

### 4. Avoid !important

- Never use `!important` in your CSS, as it breaks the natural cascade
- If you need to override a style, use more specific selectors

### 5. Adding New Common Components

If you need to add a new common component:

1. Add it to the appropriate consolidated file
2. Document it in this README
3. Update the team

## Legacy Support

For backward compatibility:

- `.btn` classes are still supported but deprecated
- The `modal-fix.css` file is no longer needed and has been replaced by `modal.css`

## Troubleshooting

If you encounter styling issues:

1. Check browser dev tools to see which CSS rules are being applied
2. Verify the import order in your component
3. Check for conflicting class names
4. Consult this README for best practices
