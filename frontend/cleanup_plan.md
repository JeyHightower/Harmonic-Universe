# Frontend Cleanup and Consolidation Plan

This document outlines the plan for cleaning up and consolidating the frontend codebase of Harmonic Universe to ensure a clean, consistent structure with a single source of truth.

## Issues Identified

### 1. Duplicate Components

- Components exist in both `src/components` and `src/features` with identical functionality
  - Example: `UserProfileModal.jsx` appears in both directories
  - Many shared components should be maintained in a single location

### 2. Redundant Redux Files

- Multiple scene-related thunk files with overlapping functionality:
  - `store/thunks/sceneThunks.js`
  - `store/thunks/scenesThunks.js`
  - `store/thunks/consolidated/scenesThunks.js`
- Similar issues with slice files
  - Both `sceneSlice.js` and `scenesSlice.js` exist

### 3. Duplicate CSS Files

- CSS styles defined in multiple locations:
  - `src/styles/*.css`
  - `src/components/*/*.css`
- Potential for conflicting style rules

### 4. Nested Asset Directories

- Nested duplicates in public directory:
  - `public/assets/assets`
  - `public/images/frontend/src/consolidated`

### 5. Multiple JSX Runtime Files

- Various JSX runtime-related files that appear to be fallbacks or duplicates

### 6. Consolidated Directory Without Clear Purpose

- `src/components/consolidated` contains similar components to other directories

## Cleanup Plan

### 1. Component Consolidation

1. Keep components in `src/components` directory, organized by feature
2. Remove duplicate components in `src/features` directory
3. Update imports in all files to point to the consolidated components

### 2. Redux Store Cleanup

1. Consolidate scene thunks into a single file using the most comprehensive implementation
2. Merge scene slice files, keeping the most feature-complete one
3. Update all imports to reference the consolidated files
4. Remove the redundant files after verifying everything works

### 3. CSS Consolidation

1. Create a modular CSS approach with clear naming conventions
2. Move component-specific styles to a single location (either component directory or styles directory)
3. Remove duplicate CSS files
4. Ensure consistent styling approach throughout the application

### 4. Asset Directory Cleanup

1. Flatten nested directories in `public`
2. Organize assets by type (images, icons, etc.)
3. Remove duplicate assets
4. Update all references in code to point to the correct locations

### 5. Runtime Files Cleanup

1. Identify the primary JSX runtime file needed
2. Remove redundant fallback files
3. Update build configuration if necessary

### 6. Consolidated Directory Assessment

1. Evaluate components in `src/components/consolidated`
2. Either integrate them into the main component structure or remove if redundant
3. Update imports to point to the correct locations

## Implementation Approach

1. Begin with non-destructive tasks first:

   - Create a comprehensive component inventory
   - Map out dependencies between components
   - Document existing import patterns

2. Implement changes incrementally:

   - Start with asset organization
   - Move to CSS consolidation
   - Then component consolidation
   - Finally Redux store consolidation

3. Testing:

   - Verify each change with manual testing
   - Ensure routing works correctly
   - Confirm Redux state management functions as expected

4. Documentation:
   - Update README files with the new structure
   - Document patterns and best practices for future development
