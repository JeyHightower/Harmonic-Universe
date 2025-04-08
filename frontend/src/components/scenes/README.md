# Scene Components (Consolidated)

This directory contains all scene-related components that have been consolidated from the following directories:

- `src/components/consolidated/`
- `src/components/scenes/`

## Components

- `SceneCard.jsx` - Displays a card view of a scene
- `SceneDeleteConfirmation.jsx` - Dialog for confirming scene deletion
- `SceneDetail.jsx` - Displays detailed information about a scene
- `SceneEditPage.jsx` - Page for editing a scene
- `SceneForm.jsx` - Form for creating or editing a scene
- `SceneModalHandler.jsx` - Handles modal actions for scenes
- `ScenesExample.jsx` - Example scene component
- `SceneViewer.jsx` - Component for viewing scenes
- `ScenesList.jsx` - Displays a list of scenes

## Consolidation Strategy

These components were consolidated to ensure a single source of truth for scene-related components and to eliminate duplicate or similar implementations across the codebase. This helps maintain consistency and simplifies the codebase.

## Usage

Import these components using:

```javascript
import {
  SceneCard,
  SceneDeleteConfirmation,
  SceneDetail,
  SceneEditPage,
  SceneForm,
  SceneModalHandler,
  ScenesExample,
  SceneViewer,
  ScenesList,
} from "../components/scenes";
```
