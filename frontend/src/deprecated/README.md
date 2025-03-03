# Deprecated Components

This directory contains components that have been deprecated and should not be used in new code.

## Modal Components

The following modal components have been deprecated in favor of the standardized modal system:

- `MusicGenerationModal.jsx` - Use `AudioGenerationModal.jsx` from `frontend/src/features/audio` instead
- `MusicModal.jsx` - Use `AudioDetailsModal.jsx` from `frontend/src/features/audio` instead
- `PhysicsObjectModal.jsx` - Use `PhysicsObjectFormModal.jsx` from `frontend/src/features/physicsObjects` instead
- `PhysicsParametersModal.jsx` - Use `PhysicsParametersModal.jsx` from `frontend/src/features/physicsParameters` instead
- `PhysicsSettingsModal.jsx` - Use `PhysicsParametersModal.jsx` from `frontend/src/features/physicsParameters` instead
- `SceneModal.jsx` - Use `SceneFormModal.jsx` from `frontend/src/features/scenes` instead
- `UniverseModal.jsx` - Use `UniverseFormModal.jsx` from `frontend/src/features/universe` instead

## BaseModal

The `BaseModal.jsx` component has been deprecated in favor of the standardized `Modal.jsx` component.

- `BaseModal.jsx` - Use `Modal.jsx` from `frontend/src/components/common` instead
- `BaseModal.css` - Use `modal.css` from `frontend/src/styles` instead

## Reason for Deprecation

These components were deprecated as part of the modal system standardization effort. The new modal system uses a single `Modal.jsx` component with a context-based approach for managing modals throughout the application.

The standardized modal system provides:

- Consistent user experience
- Better accessibility
- Improved performance
- Easier maintenance

## Migration Guide

To migrate from deprecated modal components to the new modal system, follow these steps:

### Step 1: Import the necessary hooks and constants

```jsx
import { useModal } from '../contexts/ModalContext';
import { MODAL_TYPES } from '../utils/modalRegistry';
```

### Step 2: Replace direct imports with useModal hook

Before:

```jsx
import MusicGenerationModal from './MusicGenerationModal';
```

After:

```jsx
// No need to import the modal component directly
```

### Step 3: Replace direct modal rendering with openModalByType

Before:

```jsx
const [showModal, setShowModal] = useState(false);

// In render
{
  showModal && <MusicGenerationModal onClose={() => setShowModal(false)} />;
}
```

After:

```jsx
const { openModalByType } = useModal();

const handleOpenModal = () => {
  openModalByType(MODAL_TYPES.AUDIO_GENERATE, {
    universeId,
    sceneId,
    // Any other props needed
    onSuccess: data => {
      // Handle success
    },
  });
};

// In render - no need to include the modal directly
<Button onClick={handleOpenModal}>Generate Music</Button>;
```

### Modal Type Mapping

Use the following mapping to replace deprecated modals:

| Deprecated Modal       | New Modal Type                 |
| ---------------------- | ------------------------------ |
| MusicGenerationModal   | MODAL_TYPES.AUDIO_GENERATE     |
| MusicModal             | MODAL_TYPES.AUDIO_DETAILS      |
| PhysicsObjectModal     | MODAL_TYPES.PHYSICS_OBJECT     |
| PhysicsParametersModal | MODAL_TYPES.PHYSICS_PARAMETERS |
| PhysicsSettingsModal   | MODAL_TYPES.PHYSICS_PARAMETERS |
| SceneModal (create)    | MODAL_TYPES.SCENE_CREATE       |
| SceneModal (edit)      | MODAL_TYPES.SCENE_EDIT         |
| SceneModal (delete)    | MODAL_TYPES.CONFIRM_DELETE     |
| UniverseModal (create) | MODAL_TYPES.UNIVERSE_CREATE    |
| UniverseModal (edit)   | MODAL_TYPES.UNIVERSE_EDIT      |
| UniverseModal (delete) | MODAL_TYPES.UNIVERSE_DELETE    |

For more detailed documentation on the modal system, see `frontend/src/docs/modal-system.md`.
