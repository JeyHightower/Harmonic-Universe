# Pages Refactoring

## Overview
This document outlines the refactoring of the pages from the top-level `pages/` directory to their respective feature directories, aligning with the standardized feature structure defined in STANDARD-STRUCTURE.md.

## Changes Made
1. Moved all page components from `frontend/src/pages/` to their respective feature directories:
   - `NotesPage.jsx` → `frontend/src/components/features/note/pages/`
   - `CharactersPage.jsx` → `frontend/src/components/features/character/pages/`
   - `ScenesPage.jsx` → `frontend/src/components/features/scene/pages/`
   - `LoginPage.jsx` → `frontend/src/components/features/auth/pages/`
   - `Home.jsx` → `frontend/src/components/features/home/pages/`
   - `HarmonyPage.jsx` → `frontend/src/components/features/harmony/pages/`
   - `SettingsPage.jsx` → `frontend/src/components/features/settings/pages/`
   - `NotFound.jsx` → `frontend/src/components/features/common/pages/`
   - `Profile.jsx` → `frontend/src/components/features/profile/pages/`
   - `VisualPage.jsx` → `frontend/src/components/features/visualization/pages/`

2. Created new feature directories for pages that didn't have a corresponding feature yet:
   - `frontend/src/components/features/common/`
   - `frontend/src/components/features/settings/`
   - `frontend/src/components/features/visualization/`
   - `frontend/src/components/features/home/`

3. Updated CSS imports to use the new paths:
   - Moved `SettingsPage.css` → `frontend/src/components/features/settings/styles/`
   - Updated import in `SettingsPage.jsx` to use the styles directory

4. Updated import paths in the following files:
   - Updated `frontend/src/App.jsx` to import page components from their new locations
   - Updated `frontend/src/routes/index.jsx` to import page components from their new locations

5. Updated feature index.js files to export the new page components:
   - Added page exports to all feature index.js files
   - Created new index.js files for the new feature directories

## Directory Structure
Each feature now follows this structure with pages in their respective directories:

```
feature-name/
├── README.md
├── index.js               # Exports all feature components including pages
├── components/            # Core components
├── modals/                # Modal components
├── pages/                 # Page components
└── styles/                # CSS files
```

## Usage Example
The page components can now be imported consistently using either:

```jsx
// Direct import from feature directory
import { NotesPage } from '../components/features/note';

// Or using lazy loading
const NotesPage = lazy(() => import("../components/features/note/pages/NotesPage"));
```

## Next Steps
1. After verifying that the application works correctly with the new structure, the original `frontend/src/pages/` directory can be safely removed.
2. Update any remaining imports throughout the codebase that might still reference the old locations.
3. Continue refactoring any other components that aren't following the standardized structure. 