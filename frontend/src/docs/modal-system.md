# Modal System Documentation

## Overview

The Harmonic Universe application uses a centralized modal system that provides consistent behavior, deep linking capabilities, and improved performance. This document explains how to use the modal system in your components.

## Key Components

1. **ModalContext** - Provides state management and API for modals
2. **ModalRegistry** - Centralized registration of all modal types
3. **GlobalModal** - Renders modals using React portals
4. **ModalProvider** - Wraps the application with the modal context

## Using Modals in Components

### Step 1: Import the necessary hooks and constants

```jsx
import { useModal } from '../contexts/ModalContext';
import { MODAL_TYPES } from '../utils/modalRegistry';
```

### Step 2: Use the `openModalByType` function to open modals

```jsx
const { openModalByType } = useModal();

// Example: Opening a modal to create a new universe
const handleCreateUniverse = () => {
  openModalByType(MODAL_TYPES.UNIVERSE_CREATE, {
    // Any props needed by the modal component
    onSuccess: data => {
      // Handle success
    },
  });
};
```

### Step 3: Pass the necessary data to the modal

Each modal type expects specific props. Here are common props for different modal types:

#### Form Modals (Create/Edit)

```jsx
// Create modal
openModalByType(MODAL_TYPES.PHYSICS_OBJECT, {
  sceneId: '123',
  onSuccess: data => {
    // Handle the newly created object
  },
});

// Edit modal
openModalByType(MODAL_TYPES.PHYSICS_OBJECT, {
  sceneId: '123',
  objectId: '456',
  initialData: existingObject,
  onSuccess: data => {
    // Handle the updated object
  },
});
```

#### Info Modals

```jsx
// View universe information
openModalByType(MODAL_TYPES.UNIVERSE_INFO, {
  universe: universeData,
});

// View audio details
openModalByType(MODAL_TYPES.AUDIO_DETAILS, {
  audioId: '123',
});
```

#### Confirmation Modals

```jsx
// Delete confirmation
openModalByType(MODAL_TYPES.CONFIRM_DELETE, {
  entityType: 'scene',
  entityId: '123',
  entityName: 'My Scene',
  onConfirm: () => {
    // Handle deletion
  },
});
```

## Available Modal Types

The following modal types are available in the system:

- `PHYSICS_PARAMETERS` - Physics parameters modal
- `PHYSICS_OBJECT` - Physics object modal
- `PHYSICS_CONSTRAINT` - Physics constraint modal
- `UNIVERSE_CREATE` - Universe creation modal
- `UNIVERSE_EDIT` - Universe edit modal
- `UNIVERSE_DELETE` - Universe delete confirmation
- `UNIVERSE_INFO` - Universe information modal
- `SCENE_CREATE` - Scene creation modal
- `SCENE_EDIT` - Scene edit modal
- `SCENE_DELETE` - Scene delete confirmation
- `USER_PROFILE` - User profile modal
- `AUDIO_GENERATE` - Audio generation modal
- `AUDIO_DETAILS` - Audio details modal
- `AUDIO_EDIT` - Audio edit modal
- `VISUALIZATION_CREATE` - Visualization creation modal
- `VISUALIZATION_EDIT` - Visualization edit modal
- `CONFIRM_DELETE` - Generic delete confirmation modal

## Deprecated Modal Components

The following modal components have been deprecated in favor of the standardized modal system:

- `MusicGenerationModal.jsx` - Use `MODAL_TYPES.AUDIO_GENERATE` instead
- `MusicModal.jsx` - Use `MODAL_TYPES.AUDIO_DETAILS` instead
- `PhysicsObjectModal.jsx` - Use `MODAL_TYPES.PHYSICS_OBJECT` instead
- `PhysicsParametersModal.jsx` - Use `MODAL_TYPES.PHYSICS_PARAMETERS` instead
- `PhysicsSettingsModal.jsx` - Use `MODAL_TYPES.PHYSICS_PARAMETERS` instead
- `SceneModal.jsx` - Use `MODAL_TYPES.SCENE_CREATE` or `MODAL_TYPES.SCENE_EDIT` instead
- `UniverseModal.jsx` - Use `MODAL_TYPES.UNIVERSE_CREATE`, `MODAL_TYPES.UNIVERSE_EDIT`, or `MODAL_TYPES.UNIVERSE_INFO` instead

## Benefits of the Modal System

1. **Centralized Management**: All modals are managed in one place
2. **Deep Linking**: Support for linking directly to modals via URLs
3. **Consistent Behavior**: All modals have consistent opening, closing, and rendering behavior
4. **Improved Performance**: Better handling of modal mounting/unmounting
5. **Reusability**: Modal components can be reused across the application

## Adding New Modal Types

To add a new modal type to the system:

1. Create a new modal component in the appropriate feature directory
2. Add a new constant to the `MODAL_TYPES` object in `modalRegistry.js`
3. Register the modal in the `ModalRegistry` component
4. Add the API route mapping if needed in `API_ROUTE_MODALS`

Example:

```jsx
// 1. Add to MODAL_TYPES
export const MODAL_TYPES = {
  // ...existing types
  MY_NEW_MODAL: 'my-new-modal',
};

// 2. Register the modal
registerModal(MODAL_TYPES.MY_NEW_MODAL, MyNewModalComponent, {
  getProps: data => ({
    // Transform data into props
  }),
  getModalProps: data => ({
    title: 'My New Modal',
    size: 'medium',
    type: 'form',
  }),
});

// 3. Add API route mapping if needed
export const API_ROUTE_MODALS = {
  // ...existing mappings
  [`${API_CONFIG.API_PREFIX}/my-new-resource`]: MODAL_TYPES.MY_NEW_MODAL,
};
```
