# Universe Components (Consolidated)

This directory contains all universe-related components that have been consolidated from the following directories:

- `src/components/universe/`
- `src/components/modals/` (universe-related modals)
- `src/features/` (universe-related feature components)

## Components

- `CreateUniverseModal.jsx` - Modal for creating a universe (simple version)
- `DeleteUniverseModal.jsx` - Modal for confirming universe deletion
- `EditUniverseModal.jsx` - Modal for editing a universe
- `SceneCardSimple.jsx` - Simplified scene card used in universe views
- `UniverseCard.jsx` - Displays a card view of a universe
- `UniverseCreate.jsx` - Component for creating a universe
- `UniverseCreateModal.jsx` - Modal for creating a universe (full version)
- `UniverseDeleteModal.jsx` - Alternate modal for confirming universe deletion
- `UniverseDetail.jsx` - Displays detailed information about a universe
- `UniverseEdit.jsx` - Component for editing a universe
- `UniverseFormModal.jsx` - Form modal for creating or editing a universe
- `UniverseInfoModal.jsx` - Modal displaying universe information
- `UniverseList.jsx` - Displays a list of universes
- `UniverseManager.jsx` - Manager component for universes
- `UniverseModal.jsx` - Generic universe modal

## Consolidation Strategy

These components were consolidated to ensure a single source of truth for universe-related components and to eliminate duplicate or similar implementations. Several of these components have overlapping functionality and will need to be further consolidated:

- `CreateUniverseModal.jsx` vs `UniverseCreateModal.jsx` vs `UniverseFormModal.jsx`
- `DeleteUniverseModal.jsx` vs `UniverseDeleteModal.jsx`

## Usage

Import these components using:

```javascript
import {
  UniverseCard,
  UniverseList,
  UniverseDetail,
  UniverseFormModal,
  // other components...
} from "../components/universe";
```
